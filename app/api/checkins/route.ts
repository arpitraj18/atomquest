import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const goalId = searchParams.get('goal_id')

  let query = supabaseAdmin.from('check_ins').select('*, goal:goals(*)')
  if (goalId) query = query.eq('goal_id', goalId)

  const { data, error } = await query.order('checked_in_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data: existing } = await supabaseAdmin
    .from('check_ins')
    .select('id')
    .eq('goal_id', body.goal_id)
    .eq('quarter', body.quarter)
    .single()

  let result

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('check_ins')
      .update(body)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  } else {
    const { data, error } = await supabaseAdmin
      .from('check_ins').insert(body).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  }

  const { data: primaryGoal } = await supabaseAdmin
    .from('goals')
    .select('id, shared_from_goal_id')
    .eq('id', body.goal_id)
    .single()

  if (primaryGoal) {
    const sourceId = primaryGoal.shared_from_goal_id || primaryGoal.id
    const { data: linkedGoals } = await supabaseAdmin
      .from('goals')
      .select('id')
      .or('id.eq.' + sourceId + ',shared_from_goal_id.eq.' + sourceId)

    for (const linked of linkedGoals || []) {
      if (linked.id === body.goal_id) continue
      const { data: existingLinked } = await supabaseAdmin
        .from('check_ins')
        .select('id')
        .eq('goal_id', linked.id)
        .eq('quarter', body.quarter)
        .single()

      if (existingLinked) {
        await supabaseAdmin
          .from('check_ins')
          .update({ actual_achievement: body.actual_achievement, status: body.status })
          .eq('id', existingLinked.id)
      } else {
        await supabaseAdmin
          .from('check_ins')
          .insert({ ...body, goal_id: linked.id })
      }
    }
  }

  return NextResponse.json(result)
}