import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendCheckInReminderEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { quarter } = await req.json()

  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('role', 'employee')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  for (const user of users || []) {
    try {
      await sendCheckInReminderEmail(user.email, user.name, quarter)
      sent++
    } catch (e) {
      console.error('Failed to send to', user.email, e)
    }
  }

  return NextResponse.json({ success: true, sent })
}