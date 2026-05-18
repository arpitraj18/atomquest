import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const MANAGER_ID = '6285da6b-f3c1-4315-81d8-3500e65c490c'
const CYCLE_ID = '10445bc7-2f6e-4273-98c7-e9547cb668db'
const Q1_AT = '2025-08-15T10:00:00Z'
const Q2_AT = '2025-11-10T10:00:00Z'
const Q3_AT = '2026-02-12T10:00:00Z'
const Q3_LATE = '2026-03-29T23:45:00Z'

// ─── Employee definitions ────────────────────────────────────────────────────

const EMPLOYEES = [
  // ── Pattern A: On Track (4 employees) ─────────────────────────────────────
  {
    name: 'Neha Kapoor', email: 'neha@demo.com',
    role: 'employee', department: 'Engineering', manager_id: MANAGER_ID,
    goals: [
      {
        thrust_area: 'Operational Excellence', title: 'Improve Sprint Velocity',
        description: 'Increase team sprint velocity from 60 to 80 story points per sprint by year end.',
        uom_type: 'min', target: 80, weightage: 60,
        checkIns: [
          { quarter: 'Q1', actual: 36, status: 'on_track', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 56, status: 'on_track', mc: 'Good progress this quarter! Velocity is improving steadily.', at: Q2_AT },
          { quarter: 'Q3', actual: 72, status: 'completed', mc: 'Excellent work — well on track to meet the annual target.', at: Q3_AT },
        ],
      },
      {
        thrust_area: 'Operational Excellence', title: 'Reduce Bug Backlog',
        description: 'Reduce open bug count to under 30 by end of year through targeted sprints.',
        uom_type: 'min', target: 30, weightage: 40,
        checkIns: [
          { quarter: 'Q1', actual: 12, status: 'on_track', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 21, status: 'on_track', mc: 'Consistent improvement. Keep up the systematic approach.', at: Q2_AT },
          { quarter: 'Q3', actual: 27, status: 'completed', mc: 'Almost at target — great discipline on bug triage.', at: Q3_AT },
        ],
      },
    ],
  },
  {
    name: 'Vikram Singh', email: 'vikram@demo.com',
    role: 'employee', department: 'Sales', manager_id: MANAGER_ID,
    goals: [
      {
        thrust_area: 'Revenue Growth', title: 'Achieve Quarterly Revenue Target',
        description: 'Close deals to achieve INR 1 crore in quarterly revenue.',
        uom_type: 'min', target: 1000000, weightage: 70,
        checkIns: [
          { quarter: 'Q1', actual: 480000, status: 'on_track', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 720000, status: 'on_track', mc: 'Strong pipeline momentum. Q3 looks solid.', at: Q2_AT },
          { quarter: 'Q3', actual: 880000, status: 'completed', mc: 'Very close to annual target. Outstanding performance.', at: Q3_AT },
        ],
      },
      {
        thrust_area: 'Revenue Growth', title: 'Increase Sales Pipeline',
        description: 'Build a qualified pipeline of 50 enterprise prospects.',
        uom_type: 'min', target: 50, weightage: 30,
        checkIns: [
          { quarter: 'Q1', actual: 20, status: 'on_track', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 35, status: 'on_track', mc: 'Pipeline growth on track. Focus on conversion now.', at: Q2_AT },
          { quarter: 'Q3', actual: 44, status: 'completed', mc: 'Pipeline is healthy and well-qualified.', at: Q3_AT },
        ],
      },
    ],
  },
  {
    name: 'Ananya Iyer', email: 'ananya@demo.com',
    role: 'employee', department: 'Marketing', manager_id: MANAGER_ID,
    goals: [
      {
        thrust_area: 'Customer Experience', title: 'Improve NPS Score',
        description: 'Raise Net Promoter Score from 40 to 60 through CX initiatives.',
        uom_type: 'min', target: 60, weightage: 50,
        checkIns: [
          { quarter: 'Q1', actual: 28, status: 'on_track', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 44, status: 'on_track', mc: 'NPS improving steadily. Campaign impact is showing.', at: Q2_AT },
          { quarter: 'Q3', actual: 54, status: 'completed', mc: 'Very strong NPS gains. Only 6 points from target.', at: Q3_AT },
        ],
      },
      {
        thrust_area: 'Customer Experience', title: 'Increase Brand Awareness Reach',
        description: 'Expand total organic brand reach to 200,000 unique users.',
        uom_type: 'min', target: 200000, weightage: 30,
        checkIns: [
          { quarter: 'Q1', actual: 84000, status: 'on_track', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 144000, status: 'on_track', mc: 'Reach growing well — content strategy is working.', at: Q2_AT },
          { quarter: 'Q3', actual: 180000, status: 'completed', mc: 'Excellent progress. 90% of target reached.', at: Q3_AT },
        ],
      },
      {
        thrust_area: 'Innovation', title: 'Launch 3 Digital Marketing Campaigns',
        description: 'Conceptualise, execute and report on 3 full-funnel digital campaigns.',
        uom_type: 'min', target: 3, weightage: 20,
        checkIns: [
          { quarter: 'Q1', actual: 1, status: 'on_track', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 2, status: 'on_track', mc: 'Two campaigns live. Third in final review.', at: Q2_AT },
          { quarter: 'Q3', actual: 3, status: 'completed', mc: 'All 3 campaigns launched and measured successfully.', at: Q3_AT },
        ],
      },
    ],
  },
  {
    name: 'Rohit Verma', email: 'rohit@demo.com',
    role: 'employee', department: 'Engineering', manager_id: MANAGER_ID,
    goals: [
      {
        thrust_area: 'Operational Excellence', title: 'Deliver System Migration Project',
        description: 'Complete legacy system migration to cloud with zero production incidents.',
        uom_type: 'min', target: 100, weightage: 40,
        checkIns: [
          { quarter: 'Q1', actual: 38, status: 'on_track', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 65, status: 'on_track', mc: 'Migration progressing well. Core modules complete.', at: Q2_AT },
          { quarter: 'Q3', actual: 85, status: 'on_track', mc: 'On schedule. Final integrations underway.', at: Q3_AT },
        ],
      },
      {
        thrust_area: 'Operational Excellence', title: 'Improve API Response Time Score',
        description: 'Achieve a p95 response time benchmark score of 100.',
        uom_type: 'min', target: 100, weightage: 35,
        checkIns: [
          { quarter: 'Q1', actual: 45, status: 'on_track', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 70, status: 'on_track', mc: 'Optimisations are paying off — latency down significantly.', at: Q2_AT },
          { quarter: 'Q3', actual: 88, status: 'completed', mc: 'Excellent improvements. Nearly at benchmark.', at: Q3_AT },
        ],
      },
      {
        thrust_area: 'Compliance & Risk', title: 'Complete Security Audit Checklist',
        description: 'Address all 100 items in the annual security audit framework.',
        uom_type: 'min', target: 100, weightage: 25,
        checkIns: [
          { quarter: 'Q1', actual: 30, status: 'on_track', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 60, status: 'on_track', mc: 'Half of audit checklist completed. Prioritising critical items.', at: Q2_AT },
          { quarter: 'Q3', actual: 80, status: 'on_track', mc: '80% done. Remaining items are low-severity findings.', at: Q3_AT },
        ],
      },
    ],
  },
  // ── Pattern B: At Risk (2 employees) ──────────────────────────────────────
  {
    name: 'Priyanka Das', email: 'priyanka@demo.com',
    role: 'employee', department: 'HR', manager_id: MANAGER_ID,
    goals: [
      {
        thrust_area: 'People & Culture', title: 'Reduce Employee Attrition Rate',
        description: 'Bring voluntary attrition rate down to 10% through retention initiatives.',
        uom_type: 'max', target: 10, weightage: 50,
        checkIns: [
          { quarter: 'Q1', actual: 18, status: 'on_track', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 17, status: 'on_track', mc: 'Progress has been minimal this quarter. Retention programmes need to be intensified.', at: Q2_AT },
          { quarter: 'Q3', actual: 16, status: 'on_track', mc: 'Attrition is barely improving. Please present a revised action plan by next week.', at: Q3_AT },
        ],
      },
      {
        thrust_area: 'People & Culture', title: 'Conduct Employee Training Sessions',
        description: 'Deliver 20 skill-building training sessions across all departments.',
        uom_type: 'min', target: 20, weightage: 50,
        checkIns: [
          { quarter: 'Q1', actual: 6, status: 'on_track', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 8, status: 'on_track', mc: 'Progress is slower than expected. Need to schedule more sessions immediately.', at: Q2_AT },
          { quarter: 'Q3', actual: 9, status: 'on_track', mc: 'Significantly behind target. This needs urgent attention and a revised delivery plan.', at: Q3_AT },
        ],
      },
    ],
  },
  {
    name: 'Arjun Mehta', email: 'arjun@demo.com',
    role: 'employee', department: 'Sales', manager_id: MANAGER_ID,
    goals: [
      {
        thrust_area: 'Revenue Growth', title: 'Acquire New Enterprise Clients',
        description: 'Onboard 50 new enterprise clients through outbound and partnership channels.',
        uom_type: 'min', target: 50, weightage: 60,
        checkIns: [
          { quarter: 'Q1', actual: 22, status: 'on_track', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 17, status: 'on_track', mc: 'Acquisition rate has dropped compared to Q1. Identify the top blockers and address them urgently.', at: Q2_AT },
          { quarter: 'Q3', actual: 19, status: 'on_track', mc: 'Performance remains significantly below target. A root cause analysis is required before the next review.', at: Q3_AT },
        ],
      },
      {
        thrust_area: 'Revenue Growth', title: 'Achieve Sales Revenue Quota',
        description: 'Hit INR 5 lakh quarterly revenue quota through new and upsell deals.',
        uom_type: 'min', target: 500000, weightage: 40,
        checkIns: [
          { quarter: 'Q1', actual: 195000, status: 'on_track', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 145000, status: 'on_track', mc: 'Revenue has declined from Q1. This is concerning and needs immediate corrective action.', at: Q2_AT },
          { quarter: 'Q3', actual: 165000, status: 'on_track', mc: 'Still well below quota. Escalation to sales director may be necessary if Q4 targets are not met.', at: Q3_AT },
        ],
      },
    ],
  },
  // ── Pattern C: Anomalous — last-minute spike (2 employees) ────────────────
  {
    name: 'Sneha Reddy', email: 'sneha@demo.com',
    role: 'employee', department: 'Marketing', manager_id: MANAGER_ID,
    goals: [
      {
        thrust_area: 'Innovation', title: 'Launch Digital Marketing Campaign',
        description: 'Plan and execute a full-funnel digital campaign scoring 100 on the campaign scorecard.',
        uom_type: 'min', target: 100, weightage: 60,
        checkIns: [
          { quarter: 'Q1', actual: 10, status: 'not_started', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 15, status: 'not_started', mc: 'Minimal progress noted. Please provide a detailed update in our next one-on-one.', at: Q2_AT },
          { quarter: 'Q3', actual: 99, status: 'completed', mc: 'Significant jump in numbers this quarter. Please provide supporting documentation and evidence for this progress.', at: Q3_LATE },
        ],
      },
      {
        thrust_area: 'Customer Experience', title: 'Achieve Social Media Growth Target',
        description: 'Grow social media engagement score to 100 across all platforms.',
        uom_type: 'min', target: 100, weightage: 40,
        checkIns: [
          { quarter: 'Q1', actual: 9, status: 'not_started', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 14, status: 'not_started', mc: 'Very limited activity here. Needs to be prioritised immediately.', at: Q2_AT },
          { quarter: 'Q3', actual: 98, status: 'completed', mc: 'Unexpectedly large improvement claimed. Awaiting data verification.', at: Q3_LATE },
        ],
      },
    ],
  },
  {
    name: 'Karan Shah', email: 'karan@demo.com',
    role: 'employee', department: 'Engineering', manager_id: MANAGER_ID,
    goals: [
      {
        thrust_area: 'Operational Excellence', title: 'Complete Technical Documentation',
        description: 'Document all core system components, APIs and runbooks to a 100-point completeness score.',
        uom_type: 'min', target: 100, weightage: 50,
        checkIns: [
          { quarter: 'Q1', actual: 8, status: 'not_started', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 12, status: 'not_started', mc: 'Documentation work appears stalled. Please unblock this and provide an updated timeline.', at: Q2_AT },
          { quarter: 'Q3', actual: 99, status: 'completed', mc: 'Sudden near-complete documentation claimed. Requesting a documentation review session to verify.', at: Q3_LATE },
        ],
      },
      {
        thrust_area: 'Operational Excellence', title: 'Deploy Microservices Architecture',
        description: 'Score 100 on the microservices adoption scorecard by migrating all monolith components.',
        uom_type: 'min', target: 100, weightage: 30,
        checkIns: [
          { quarter: 'Q1', actual: 11, status: 'not_started', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 16, status: 'not_started', mc: 'No meaningful migration progress observed. Needs urgent prioritisation.', at: Q2_AT },
          { quarter: 'Q3', actual: 99, status: 'completed', mc: 'Large jump in migration score. Please walk me through the deployment records.', at: Q3_LATE },
        ],
      },
      {
        thrust_area: 'Innovation', title: 'Implement CI/CD Pipeline',
        description: 'Achieve 100% CI/CD coverage score across all active engineering repositories.',
        uom_type: 'min', target: 100, weightage: 20,
        checkIns: [
          { quarter: 'Q1', actual: 12, status: 'not_started', mc: null, at: Q1_AT },
          { quarter: 'Q2', actual: 18, status: 'not_started', mc: 'CI/CD implementation is significantly behind schedule.', at: Q2_AT },
          { quarter: 'Q3', actual: 98, status: 'completed', mc: 'Claimed full implementation in one quarter. Evidence review needed.', at: Q3_LATE },
        ],
      },
    ],
  },
]

// ─── POST handler ────────────────────────────────────────────────────────────

export async function POST() {
  const insertedUsers: string[] = []
  const insertedGoals: string[] = []
  const insertedCheckIns: string[] = []

  for (const emp of EMPLOYEES) {
    // 1. Upsert user by email
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          name: emp.name,
          email: emp.email,
          role: emp.role,
          department: emp.department,
          manager_id: emp.manager_id,
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single()

    if (userErr || !user) {
      return NextResponse.json({ error: 'Failed to upsert user: ' + emp.email + ' — ' + userErr?.message }, { status: 500 })
    }

    insertedUsers.push(user.id)

    // 2. Clean up existing goals + check-ins for this user (idempotent re-runs)
    const { data: existingGoals } = await supabaseAdmin
      .from('goals')
      .select('id')
      .eq('employee_id', user.id)

    if (existingGoals && existingGoals.length > 0) {
      const gIds = existingGoals.map((g: any) => g.id)
      await supabaseAdmin.from('check_ins').delete().in('goal_id', gIds)
      await supabaseAdmin.from('goals').delete().eq('employee_id', user.id)
    }

    // 3. Insert goals
    for (const g of emp.goals) {
      const { data: goal, error: goalErr } = await supabaseAdmin
        .from('goals')
        .insert({
          employee_id: user.id,
          cycle_id: CYCLE_ID,
          thrust_area: g.thrust_area,
          title: g.title,
          description: g.description,
          uom_type: g.uom_type,
          target: g.target,
          weightage: g.weightage,
          status: 'approved',
          locked_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (goalErr || !goal) {
        return NextResponse.json({ error: 'Failed to insert goal: ' + g.title + ' — ' + goalErr?.message }, { status: 500 })
      }

      insertedGoals.push(goal.id)

      // 4. Insert check-ins
      for (const ci of g.checkIns) {
        const row: any = {
          goal_id: goal.id,
          quarter: ci.quarter,
          actual_achievement: ci.actual,
          status: ci.status,
          checked_in_at: ci.at,
        }
        if (ci.mc) row.manager_comment = ci.mc

        const { data: checkIn, error: ciErr } = await supabaseAdmin
          .from('check_ins')
          .insert(row)
          .select('id')
          .single()

        if (ciErr || !checkIn) {
          return NextResponse.json({ error: 'Failed to insert check-in: ' + ciErr?.message }, { status: 500 })
        }

        insertedCheckIns.push(checkIn.id)
      }
    }
  }

  return NextResponse.json({
    success: true,
    inserted: {
      users: insertedUsers.length,
      goals: insertedGoals.length,
      checkIns: insertedCheckIns.length,
    },
  })
}
