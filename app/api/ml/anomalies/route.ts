import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { computeScore } from '@/lib/scoring'

function zScores(values: number[]): number[] {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length)
  if (std === 0) return values.map(() => 0)
  return values.map(v => (v - mean) / std)
}

export async function GET() {
  const [{ data: rawGoals }, { data: rawCheckIns }, { data: rawUsers }] = await Promise.all([
    supabaseAdmin.from('goals').select('*, employee:users(id, name, department)').eq('status', 'approved'),
    supabaseAdmin.from('check_ins').select('*').order('quarter', { ascending: true }),
    supabaseAdmin.from('users').select('id, name, department').eq('role', 'employee'),
  ])

  const goals = rawGoals || []
  const checkIns = rawCheckIns || []
  const users = rawUsers || []

  // Build per-employee aggregate metrics
  const employeeMetrics = users.map((user: any) => {
    const userGoals = goals.filter((g: any) => g.employee?.id === user.id)
    if (userGoals.length === 0) return null

    const allScores: number[] = []
    let lateCICount = 0
    let maxSpike = 0

    userGoals.forEach((goal: any) => {
      const cis = checkIns
        .filter((ci: any) => ci.goal_id === goal.id)
        .sort((a: any, b: any) => a.quarter.localeCompare(b.quarter))

      if (cis.length === 0) return

      const scores = cis.map((ci: any) =>
        computeScore(goal.uom_type, goal.target, ci.actual_achievement) / 100,
      )
      allScores.push(...scores)

      // Detect late submissions: gap between consecutive check-ins > 120 days
      for (let i = 1; i < cis.length; i++) {
        const prev = new Date(cis[i - 1].checked_in_at).getTime()
        const curr = new Date(cis[i].checked_in_at).getTime()
        const daysDiff = (curr - prev) / (1000 * 60 * 60 * 24)
        if (daysDiff > 120) lateCICount++
      }

      // Max quarter-over-quarter spike across all goals
      for (let i = 1; i < scores.length; i++) {
        const spike = scores[i] - scores[i - 1]
        if (spike > maxSpike) maxSpike = spike
      }
    })

    const avg_progress = allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0

    const mean_s = avg_progress
    const score_variance = allScores.length > 0
      ? allScores.reduce((s, v) => s + (v - mean_s) ** 2, 0) / allScores.length
      : 0

    return {
      user_id: user.id,
      name: user.name,
      department: user.department,
      metrics: {
        avg_progress: Math.round(avg_progress * 100) / 100,
        score_variance: Math.round(score_variance * 1000) / 1000,
        late_checkins: lateCICount,
        max_quarter_spike: Math.round(maxSpike * 100) / 100,
      },
    }
  }).filter(Boolean)

  if (employeeMetrics.length === 0) {
    return NextResponse.json([])
  }

  // Z-score each metric across all employees
  const avgProgressVals = employeeMetrics.map((e: any) => e.metrics.avg_progress)
  const varianceVals = employeeMetrics.map((e: any) => e.metrics.score_variance)
  const lateVals = employeeMetrics.map((e: any) => e.metrics.late_checkins)
  const spikeVals = employeeMetrics.map((e: any) => e.metrics.max_quarter_spike)

  const zAvgProgress = zScores(avgProgressVals)
  const zVariance = zScores(varianceVals)
  const zLate = zScores(lateVals)
  const zSpike = zScores(spikeVals)

  const THRESHOLD = 2.0

  const result = employeeMetrics.map((emp: any, idx: number) => {
    const z = {
      avg_progress: Math.round(zAvgProgress[idx] * 100) / 100,
      score_variance: Math.round(zVariance[idx] * 100) / 100,
      late_checkins: Math.round(zLate[idx] * 100) / 100,
      max_quarter_spike: Math.round(zSpike[idx] * 100) / 100,
    }

    // Flag anomaly if any z-score exceeds ±2.0
    const anomalousFields = Object.entries(z)
      .filter(([, v]) => Math.abs(v) > THRESHOLD)
      .map(([k]) => k)

    const is_anomaly = anomalousFields.length > 0

    let reason = ''
    if (is_anomaly) {
      const parts: string[] = []
      if (Math.abs(z.avg_progress) > THRESHOLD)
        parts.push(z.avg_progress < 0 ? 'significantly below-average progress' : 'unusually high average progress')
      if (Math.abs(z.score_variance) > THRESHOLD)
        parts.push('high score variance across quarters')
      if (Math.abs(z.late_checkins) > THRESHOLD)
        parts.push('late check-in submissions')
      if (Math.abs(z.max_quarter_spike) > THRESHOLD)
        parts.push('sudden spike in quarterly score')
      reason = parts.join('; ')
    }

    return {
      user_id: emp.user_id,
      name: emp.name,
      department: emp.department,
      metrics: emp.metrics,
      z_scores: z,
      is_anomaly,
      reason,
    }
  })

  return NextResponse.json(result)
}
