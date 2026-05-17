export async function sendTeamsNotification(
    title: string,
    message: string,
    deepLink: string,
    color: number = 0x0078D4
  ) {
    const webhookUrl = process.env.TEAMS_WEBHOOK_URL
    if (!webhookUrl) return
  
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title,
            description: message + '\n\n[View in portal](' + deepLink + ')',
            color,
            footer: { text: 'AtomQuest Goal Portal' },
            timestamp: new Date().toISOString(),
          }]
        }),
      })
    } catch (e) {
      console.error('Notification failed:', e)
    }
  }
  
  export async function notifyGoalSubmitted(employeeName: string, baseUrl: string) {
    await sendTeamsNotification(
      'New goal sheet submitted',
      employeeName + ' has submitted their goal sheet and is awaiting your approval.',
      baseUrl + '/dashboard/manager',
      0x2563EB
    )
  }
  
  export async function notifyGoalApproved(employeeName: string, baseUrl: string) {
    await sendTeamsNotification(
      'Goals approved',
      'Goal sheet for ' + employeeName + ' has been approved and locked.',
      baseUrl + '/dashboard/goals',
      0x16A34A
    )
  }
  
  export async function notifyGoalReturned(employeeName: string, baseUrl: string) {
    await sendTeamsNotification(
      'Goals returned for rework',
      employeeName + ', your manager has returned your goal sheet for revision.',
      baseUrl + '/dashboard/goals',
      0xDC2626
    )
  }
  
  export async function notifyCheckInDue(quarter: string, baseUrl: string) {
    await sendTeamsNotification(
      quarter + ' check-in window is open',
      'All employees — please log your actual achievement against planned targets for ' + quarter + '.',
      baseUrl + '/dashboard/goals/checkin',
      0x7C3AED
    )
  }