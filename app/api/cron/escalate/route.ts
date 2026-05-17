import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendCheckInReminderEmail } from '@/lib/email'
import { Resend } from 'resend'

const resend = new Resend('re_hhPjRGGw_4p7kbidu2tBvLwph6SX8Sk2m')

async function sendEscalationEmail(to: string, name: string, reason: string) {
  await resend.emails.send({
    from: 'AtomQuest <onboarding@resend.dev>',
    to,
    subject: 'Action required — ' + reason,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#dc2626">Escalation notice</h2>
        <p style="color:#444">Hi ${name},</p>
        <p style="color:#444">This is an automated escalation notice: <strong>${reason}</strong></p>
        <p style="color:#444">Please take action immediately to avoid further escalation.</p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard"
          style="display:inline-block;background:#dc2626;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:12px">
          Go to portal →
        </a>
        <p style="color:#888;font-size:12px;margin-top:24px">AtomQuest Goal Portal</p>
      </div>
    `,
  })
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runEscalations()
}

export async function POST(req: NextRequest) {
  return runEscalations()
}

async function runEscalations() {
  const now = new Date()
  const results: string[] = []

  const { data: rules } = await supabaseAdmin
    .from('escalation_rules')
    .select('*')
    .eq('is_active', true)

  if (!rules || rules.length === 0) {
    return NextResponse.json({ message: 'No active rules', results: [] })
  }

  for (const rule of rules) {
    const daysAgo = new Date(now.getTime() - rule.days_threshold * 24 * 60 * 60 * 1000)

    if (rule.rule_type === 'goal_not_submitted') {
      const { data: cycles } = await supabaseAdmin
        .from('goal_cycles')
        .select('*')
        .eq('is_active', true)
        .single()

      if (!cycles) continue

      const cycleOpen = new Date(cycles.phase1_opens)
      if (cycleOpen > daysAgo) continue

      const { data: employees } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('role', 'employee')

      for (const emp of employees || []) {
        const { data: goals } = await supabaseAdmin
          .from('goals')
          .select('id')
          .eq('employee_id', emp.id)
          .eq('cycle_id', cycles.id)

        if (!goals || goals.length === 0) {
          await supabaseAdmin.from('escalations').insert({
            rule_type: rule.rule_type,
            target_user_id: emp.id,
            notified_levels: 1,
          })
          try {
            await sendEscalationEmail(emp.email, emp.name, 'You have not submitted your goals yet')
            results.push('Escalated: ' + emp.name + ' has not submitted goals')
          } catch (e) {
            results.push('Email failed for ' + emp.name)
          }
        }
      }
    }

    if (rule.rule_type === 'goal_not_approved') {
      const { data: pendingGoals } = await supabaseAdmin
        .from('goals')
        .select('*, employee:users(*)')
        .eq('status', 'submitted')
        .lt('created_at', daysAgo.toISOString())

      for (const goal of pendingGoals || []) {
        const { data: manager } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', goal.employee?.manager_id)
          .single()

        if (manager) {
          await supabaseAdmin.from('escalations').insert({
            rule_type: rule.rule_type,
            target_user_id: manager.id,
            notified_levels: 1,
          })
          try {
            await sendEscalationEmail(
              manager.email,
              manager.name,
              goal.employee?.name + ' submitted goals ' + rule.days_threshold + '+ days ago and awaits your approval'
            )
            results.push('Escalated: ' + manager.name + ' has pending approval for ' + goal.employee?.name)
          } catch (e) {
            results.push('Email failed for ' + manager.name)
          }
        }
      }
    }

    if (rule.rule_type === 'checkin_not_done') {
      const { data: approvedGoals } = await supabaseAdmin
        .from('goals')
        .select('*, employee:users(*)')
        .eq('status', 'approved')

      const currentQuarter = getCurrentQuarter()

      for (const goal of approvedGoals || []) {
        const { data: ci } = await supabaseAdmin
          .from('check_ins')
          .select('id')
          .eq('goal_id', goal.id)
          .eq('quarter', currentQuarter)
          .single()

        if (!ci && goal.employee) {
          await supabaseAdmin.from('escalations').insert({
            rule_type: rule.rule_type,
            target_user_id: goal.employee_id,
            notified_levels: 1,
          })
          try {
            await sendCheckInReminderEmail(goal.employee.email, goal.employee.name, currentQuarter)
            results.push('Escalated: ' + goal.employee.name + ' has not done ' + currentQuarter + ' check-in')
          } catch (e) {
            results.push('Email failed for ' + goal.employee.name)
          }
        }
      }
    }
  }

  return NextResponse.json({ success: true, results })
}

function getCurrentQuarter(): string {
  const month = new Date().getMonth() + 1
  if (month >= 7 && month <= 9) return 'Q1'
  if (month >= 10 && month <= 12) return 'Q2'
  if (month >= 1 && month <= 3) return 'Q3'
  return 'Q4'
}