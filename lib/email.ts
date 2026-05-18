import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'AtomQuest <onboarding@resend.dev>'

export async function sendGoalSubmittedEmail(managerEmail: string, managerName: string, employeeName: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to: managerEmail,
      subject: 'New goal sheet submitted — ' + employeeName,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
          <h2 style="color:#1a1a1a">New goal submission</h2>
          <p style="color:#444">Hi ${managerName},</p>
          <p style="color:#444"><strong>${employeeName}</strong> has submitted their goal sheet for your review and approval.</p>
          <a href="${process.env.NEXTAUTH_URL || 'https://atomquest-indol.vercel.app'}/dashboard/manager"
            style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:12px">
            Review goals
          </a>
          <p style="color:#888;font-size:12px;margin-top:24px">AtomQuest Goal Portal by Atomberg</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('Email error:', e)
  }
}

export async function sendGoalApprovedEmail(employeeEmail: string, employeeName: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to: employeeEmail,
      subject: 'Your goals have been approved',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
          <h2 style="color:#1a1a1a">Goals approved</h2>
          <p style="color:#444">Hi ${employeeName},</p>
          <p style="color:#444">Your goal sheet has been approved by your manager and is now locked for this cycle.</p>
          <a href="${process.env.NEXTAUTH_URL || 'https://atomquest-indol.vercel.app'}/dashboard/goals"
            style="display:inline-block;background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:12px">
            View my goals
          </a>
          <p style="color:#888;font-size:12px;margin-top:24px">AtomQuest Goal Portal by Atomberg</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('Email error:', e)
  }
}

export async function sendGoalReturnedEmail(employeeEmail: string, employeeName: string, comment: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to: employeeEmail,
      subject: 'Your goals need revision',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
          <h2 style="color:#1a1a1a">Goals returned for rework</h2>
          <p style="color:#444">Hi ${employeeName},</p>
          <p style="color:#444">Your manager has returned your goal sheet for revision.</p>
          ${comment ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin:16px 0"><p style="color:#991b1b;margin:0"><strong>Manager comment:</strong> ${comment}</p></div>` : ''}
          <a href="${process.env.NEXTAUTH_URL || 'https://atomquest-indol.vercel.app'}/dashboard/goals"
            style="display:inline-block;background:#dc2626;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:12px">
            Revise my goals
          </a>
          <p style="color:#888;font-size:12px;margin-top:24px">AtomQuest Goal Portal by Atomberg</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('Email error:', e)
  }
}

export async function sendCheckInReminderEmail(employeeEmail: string, employeeName: string, quarter: string) {
  try {
    await resend.emails.send({
      from: FROM,
      to: employeeEmail,
      subject: quarter + ' check-in reminder',
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
          <h2 style="color:#1a1a1a">${quarter} check-in reminder</h2>
          <p style="color:#444">Hi ${employeeName},</p>
          <p style="color:#444">The <strong>${quarter}</strong> check-in window is now open. Please log your actual achievement against your planned targets.</p>
          <a href="${process.env.NEXTAUTH_URL || 'https://atomquest-indol.vercel.app'}/dashboard/goals/checkin"
            style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:12px">
            Log check-in
          </a>
          <p style="color:#888;font-size:12px;margin-top:24px">AtomQuest Goal Portal by Atomberg</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('Email error:', e)
  }
}