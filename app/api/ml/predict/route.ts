import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { computeScore } from '@/lib/scoring'

const W0 = -1.5, W1 = 3.0, W2 = 2.0, W3 = -1.0

export async function GET(req: NextRequest) {
  const goalId = req.nextUrl.searchParams.get('goal_id')
  if (!goalId) return NextResponse.json({ error: 'goal_id required' }, { status: 400 })

  const { data: goal } = await supabaseAdmin
    .from('goals')
    .select('*, employee:users(name, department)')
    .eq('id', goalId)
    .single()

  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  const { data: rawCheckIns } = await supabaseAdmin
    .from('check_ins')
    .select('*')
    .eq('goal_id', goalId)
    .order('quarter', { ascending: true })

  const cis = rawCheckIns || []

  if (cis.length === 0) {
    return NextResponse.json({
      goal_id: goalId,
      goal_title: goal.title,
      risk: 'UNKNOWN',
      probability: 0.5,
      color: 'gray',
      explanation: 'No check-in data available yet.',
      features: {
        progress_rate: 0,
        quarter_elapsed: 0,
        trend: 0,
        weightage: goal.weightage / 100,
        consistency_penalty: 0,
      },
    })
  }

  // Normalised scores per check-in (0–1)
  const scores: number[] = cis.map((ci: any) =>
    computeScore(goal.uom_type, goal.target, ci.actual_achievement) / 100,
  )
  const n = scores.length

  // Feature 1: average progress rate
  const progress_rate = scores.reduce((a, b) => a + b, 0) / n

  // Feature 2: fraction of year elapsed based on check-ins submitted
  const quarter_elapsed = n / 4

  // Feature 3: linear trend (slope of scores over quarters, clamped [-1, 1])
  const mean_i = (n - 1) / 2
  const slope_num = scores.reduce((s, v, i) => s + (i - mean_i) * (v - progress_rate), 0)
  const slope_den = scores.reduce((s, _, i) => s + (i - mean_i) ** 2, 0)
  const trend = slope_den > 0 ? Math.max(-1, Math.min(1, slope_num / slope_den)) : 0

  // Feature 4: consistency penalty (std-dev + spike detection)
  const variance = scores.reduce((s, v) => s + (v - progress_rate) ** 2, 0) / n
  const std_dev = Math.sqrt(variance)
  const delta_last = n >= 2 ? scores[n - 1] - scores[n - 2] : 0
  // Penalise a jump >0.30 when prior quarters were low — classic anomalous spike
  const spike_penalty = Math.max(0, delta_last - 0.3) * 2
  const consistency_penalty = std_dev + spike_penalty

  // Feature 5: goal weight as fraction (display only)
  const weightage = goal.weightage / 100

  // Logistic regression
  const logit = W0 + W1 * progress_rate + W2 * trend + W3 * consistency_penalty
  const probability = 1 / (1 + Math.exp(-logit))

  let risk: string, color: string
  if (probability >= 0.7) { risk = 'LOW'; color = 'green' }
  else if (probability >= 0.4) { risk = 'MEDIUM'; color = 'amber' }
  else { risk = 'HIGH'; color = 'red' }

  let explanation: string
  if (risk === 'HIGH') {
    explanation = `${goal.title} is at high risk — only ${Math.round(progress_rate * 100)}% of target achieved with declining momentum.`
  } else if (risk === 'MEDIUM') {
    explanation = `${goal.title} is progressing but needs attention — currently at ${Math.round(progress_rate * 100)}% with inconsistent quarterly growth.`
  } else {
    explanation = `${goal.title} is on track — ${Math.round(progress_rate * 100)}% achieved with positive momentum across quarters.`
  }

  return NextResponse.json({
    goal_id: goalId,
    goal_title: goal.title,
    risk,
    probability: Math.round(probability * 100) / 100,
    color,
    explanation,
    features: {
      progress_rate: Math.round(progress_rate * 100) / 100,
      quarter_elapsed: Math.round(quarter_elapsed * 100) / 100,
      trend: Math.round(trend * 100) / 100,
      weightage: Math.round(weightage * 100) / 100,
      consistency_penalty: Math.round(consistency_penalty * 100) / 100,
    },
  })
}
