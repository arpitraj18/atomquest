import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employee_id')
  const managerId = searchParams.get('manager_id')

  let query = supabaseAdmin.from('goals').select('*, employee:users(*)')

  if (employeeId) query = query.eq('employee_id', employeeId)
  if (managerId) {
    const { data: teamMembers } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('manager_id', managerId)
    const ids = (teamMembers || []).map((u: any) => u.id)
    if (ids.length === 0) return NextResponse.json([])
    query = query.in('employee_id', ids)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { goals, employee_email, cycle_id } = body

  if (!employee_email) {
    return NextResponse.json({ error: 'No email provided' }, { status: 400 })
  }

  const { data: employee, error: empError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', employee_email)
    .single()

  if (empError || !employee) {
    return NextResponse.json({ error: 'Employee not found: ' + employee_email }, { status: 400 })
  }

  const { data: existingGoals } = await supabaseAdmin
    .from('goals')
    .select('id')
    .eq('employee_id', employee.id)

  if ((existingGoals || []).length + goals.length > 8) {
    return NextResponse.json({ error: 'You cannot have more than 8 goals.' }, { status: 400 })
  }

  for (const g of goals) {
    if (Number(g.weightage) < 10) {
      return NextResponse.json({ error: 'Each goal must have at least 10% weightage.' }, { status: 400 })
    }
  }

  const toInsert = goals.map((g: any) => ({
    ...g,
    employee_id: employee.id,
    cycle_id: cycle_id || null,
    status: 'draft',
  }))

  const { data, error } = await supabaseAdmin.from('goals').insert(toInsert).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}