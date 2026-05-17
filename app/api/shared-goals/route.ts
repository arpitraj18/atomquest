import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, description, thrust_area, uom_type, target, cycle_id, employee_ids } = body

  if (!employee_ids || employee_ids.length === 0)
    return NextResponse.json({ error: 'No employees selected' }, { status: 400 })

  const { data: primaryGoal, error: primaryError } = await supabaseAdmin
    .from('goals')
    .insert({
      title,
      description,
      thrust_area,
      uom_type,
      target,
      cycle_id: cycle_id || null,
      employee_id: employee_ids[0],
      weightage: 10,
      status: 'approved',
      locked_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (primaryError)
    return NextResponse.json({ error: primaryError.message }, { status: 500 })

  if (employee_ids.length > 1) {
    const linkedGoals = employee_ids.slice(1).map((empId: string) => ({
      title,
      description,
      thrust_area,
      uom_type,
      target,
      cycle_id: cycle_id || null,
      employee_id: empId,
      weightage: 10,
      status: 'approved',
      locked_at: new Date().toISOString(),
      shared_from_goal_id: primaryGoal.id,
    }))

    const { error: linkedError } = await supabaseAdmin
      .from('goals')
      .insert(linkedGoals)

    if (linkedError)
      return NextResponse.json({ error: linkedError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, primary_goal_id: primaryGoal.id })
}