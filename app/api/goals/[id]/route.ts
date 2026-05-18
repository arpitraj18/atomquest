import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendGoalApprovedEmail, sendGoalReturnedEmail } from '@/lib/email'
import { notifyGoalApproved, notifyGoalReturned, notifyGoalSubmitted } from '@/lib/teams'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('goals')
    .select('*, employee:users(*)')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const { changed_by, ...updateData } = body
  if (updateData.status === 'approved') updateData.locked_at = new Date().toISOString()

  const { data: oldGoal } = await supabaseAdmin
    .from('goals')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabaseAdmin
    .from('goals')
    .update(updateData)
    .eq('id', id)
    .select('*, employee:users(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (oldGoal && (updateData.status || updateData.locked_at)) {
    await supabaseAdmin.from('audit_logs').insert({
      entity_type: 'goal',
      entity_id: id,
      changed_by: changed_by || null,
      change_type: 'UPDATE',
      old_value: oldGoal,
      new_value: data,
    })
  }

  const baseUrl = 'http://localhost:3000'

  try {
    if (updateData.status === 'approved' && data.employee?.email) {
      await sendGoalApprovedEmail(data.employee.email, data.employee.name)
      await notifyGoalApproved(data.employee.name, baseUrl)
    }
    if (updateData.status === 'returned' && data.employee?.email) {
      await sendGoalReturnedEmail(data.employee.email, data.employee.name, updateData.manager_comment || '')
      await notifyGoalReturned(data.employee.name, baseUrl)
    }
  } catch (e) {
    console.error('Notification error:', e)
  }

  if (updateData.status === 'submitted' && data.employee?.manager_id) {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://atomquest-indol.vercel.app'
    notifyGoalSubmitted(data.employee.name, baseUrl).catch(console.error)
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabaseAdmin.from('goals').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}