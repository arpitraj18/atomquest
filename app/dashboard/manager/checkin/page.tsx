'use client'

import { useRequireRole } from '@/lib/auth-check'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { computeScore } from '@/lib/scoring'
import { Toast, useToast } from '@/components/Toast'

function getActiveQuarter(cycle: any): string {
  if (!cycle) return 'Q1'
  const now = new Date()
  if (now >= new Date(cycle.q4_opens)) return 'Q4'
  if (now >= new Date(cycle.q3_opens)) return 'Q3'
  if (now >= new Date(cycle.q2_opens)) return 'Q2'
  if (now >= new Date(cycle.q1_opens)) return 'Q1'
  return 'Q1'
}

export default function ManagerCheckInPage() {
    const { user, status } = useRequireRole(['manager'])
  const router = useRouter()
  const [goals, setGoals] = useState<any[]>([])
  const [checkIns, setCheckIns] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [quarter, setQuarter] = useState('Q1')
  const { toast, showToast, hideToast } = useToast()

  useEffect(() => {
    fetch('/api/cycles')
      .then(r => r.json())
      .then(data => {
        const c = Array.isArray(data) ? data[0] : data
        if (c) setQuarter(getActiveQuarter(c))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/users?email=' + encodeURIComponent(user?.email))
      .then(r => r.json())
      .then(u => {
        if (!u?.id) { setLoading(false); return }
        fetch('/api/goals?manager_id=' + u.id)
          .then(r => r.json())
          .then(data => {
            const approved = Array.isArray(data) ? data.filter((g: any) => g.status === 'approved') : []
            setGoals(approved)
            approved.forEach((g: any) => {
              fetch('/api/checkins?goal_id=' + g.id)
                .then(r => r.json())
                .then(cis => {
                  if (Array.isArray(cis)) {
                    cis.forEach((ci: any) => {
                      setCheckIns(prev => ({ ...prev, [g.id + '_' + ci.quarter]: ci }))
                    })
                  }
                })
            })
            setLoading(false)
          })
      })
  }, [status, user?.email])

  async function saveCheckIn(goal: any, actual: string, ciStatus: string, managerComment: string) {
    setSaving(goal.id)
    await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_id: goal.id,
        quarter,
        actual_achievement: Number(actual),
        status: ciStatus,
        manager_comment: managerComment,
      }),
    })
    setCheckIns(prev => ({
      ...prev,
      [goal.id + '_' + quarter]: {
        actual_achievement: Number(actual),
        status: ciStatus,
        manager_comment: managerComment,
        quarter,
      }
    }))
    setSaving(null)
    showToast('Check-in saved for ' + goal.employee?.name + '!')
  }

  const grouped = goals.reduce((acc, goal) => {
    const empId = goal.employee_id
    if (!acc[empId]) acc[empId] = { employee: goal.employee, goals: [] }
    acc[empId].goals.push(goal)
    return acc
  }, {} as Record<string, { employee: any, goals: any[] }>)

  if (status === 'loading' || loading) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  )

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
            &larr; Dashboard
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-base font-semibold text-gray-900">Quarterly Check-ins</h1>
        </div>
        <select value={quarter} onChange={e => setQuarter(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm">
          {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q}>{q}</option>)}
        </select>
      </div>

      <div className="max-w-5xl mx-auto p-8">
        {goals.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">No approved goals yet</h3>
            <p className="text-sm text-gray-400 mb-4">Your team members need to submit and get their goals approved before you can conduct check-ins.</p>
            <button onClick={() => router.push('/dashboard/manager')}
              className="text-[#F97316] text-sm hover:underline transition-colors">
              Go to Team Goals &rarr;
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.values(grouped).map((group: any) => (
              <div key={group.employee?.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F97316] text-sm font-semibold flex-shrink-0">
                    {group.employee?.name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-medium text-gray-900">{group.employee?.name}</h2>
                    <p className="text-xs text-gray-400">{group.employee?.department} &middot; {group.goals.length} goals</p>
                  </div>
                </div>

                <div className="space-y-3 ml-11">
                  {group.goals.map((goal: any) => {
                    const ci = checkIns[goal.id + '_' + quarter]
                    const score = ci ? computeScore(goal.uom_type, goal.target, ci.actual_achievement) : null
                    return (
                      <CheckInCard
                        key={goal.id + '_' + quarter}
                        goal={goal}
                        ci={ci}
                        score={score}
                        quarter={quarter}
                        saving={saving === goal.id}
                        onSave={saveCheckIn}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CheckInCard({ goal, ci, score, quarter, saving, onSave }: any) {
  const [actual, setActual] = useState(ci?.actual_achievement?.toString() || '')
  const [ciStatus, setCiStatus] = useState(ci?.status || 'not_started')
  const [managerComment, setManagerComment] = useState(ci?.manager_comment || '')

  const statusColors: Record<string, string> = {
    not_started: 'text-gray-500',
    on_track: 'text-green-600',
    completed: 'text-blue-600',
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs text-gray-400 uppercase tracking-wide">{goal.thrust_area}</span>
          <h3 className="font-medium text-gray-900 mt-0.5">{goal.title}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{goal.description}</p>
        </div>
        <div className="text-right ml-4 flex-shrink-0">
          <div className="text-xs text-gray-400">Target</div>
          <div className="text-xl font-semibold text-gray-900">{goal.target}</div>
          <div className="text-xs text-gray-400">{goal.uom_type} &middot; {goal.weightage}%</div>
          {score !== null && (
            <div className={'text-lg font-semibold mt-1 ' + (score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500')}>
              {Math.round(score)}%
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Actual achievement</label>
          <input type="number" value={actual} onChange={e => setActual(e.target.value)}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm" placeholder="Enter actual" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select value={ciStatus} onChange={e => setCiStatus(e.target.value)}
            className={'w-full border border-gray-200 rounded px-3 py-2 text-sm ' + statusColors[ciStatus]}>
            <option value="not_started">Not started</option>
            <option value="on_track">On track</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Planned target</label>
          <div className="border border-gray-100 rounded px-3 py-2 text-sm bg-gray-50 text-gray-500">{goal.target}</div>
        </div>
      </div>

      <textarea value={managerComment} onChange={e => setManagerComment(e.target.value)}
        placeholder="Add a check-in comment to document your discussion with the employee..."
        rows={2} className="w-full border border-gray-200 rounded px-3 py-2 text-sm resize-none mb-3" />

      <div className="flex items-center gap-3">
        <button onClick={() => onSave(goal, actual, ciStatus, managerComment)}
          disabled={saving || !actual}
          className="bg-[#F97316] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#EA6C00] disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : ci ? 'Update check-in' : 'Save check-in'}
        </button>
        {ci && (
          <span className="text-xs text-green-600 font-medium">
            Saved &middot; actual: {ci.actual_achievement}
          </span>
        )}
      </div>
    </div>
  )
}
