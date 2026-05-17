'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireRole } from '@/lib/auth-check'
import { computeScore } from '@/lib/scoring'

function getActiveQuarter(cycle: any): string | null {
  if (!cycle) return null
  const now = new Date()
  const q4 = new Date(cycle.q4_opens)
  const q3 = new Date(cycle.q3_opens)
  const q2 = new Date(cycle.q2_opens)
  const q1 = new Date(cycle.q1_opens)
  if (now >= q4) return 'Q4'
  if (now >= q3) return 'Q3'
  if (now >= q2) return 'Q2'
  if (now >= q1) return 'Q1'
  return null
}

export default function EmployeeCheckInPage() {
  const { user, status } = useRequireRole(['employee'])
  const router = useRouter()
  const [goals, setGoals] = useState<any[]>([])
  const [checkIns, setCheckIns] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [quarter, setQuarter] = useState('Q1')
  const [cycle, setCycle] = useState<any>(null)
  const [inputs, setInputs] = useState<Record<string, { actual: string, status: string, completion_date: string }>>({})

  useEffect(() => {
    if (status !== 'authenticated') return
    const email = (user as any)?.email
    if (!email) return

    fetch('/api/cycles').then(r => r.json()).then(c => {
      if (c?.id) {
        setCycle(c)
        const active = getActiveQuarter(c)
        if (active) setQuarter(active)
      }
    })

    fetch('/api/users?email=' + encodeURIComponent(email))
      .then(r => r.json())
      .then(u => {
        if (!u?.id) { setLoading(false); return }
        fetch('/api/goals?employee_id=' + u.id)
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
                      setInputs(prev => ({
                        ...prev,
                        [g.id + '_' + ci.quarter]: {
                          actual: ci.actual_achievement?.toString() || '',
                          status: ci.status || 'not_started',
                          completion_date: ci.completion_date || '',
                        }
                      }))
                    })
                  }
                })
            })
            setLoading(false)
          })
      })
  }, [status, user])

  function getInput(goalId: string) {
    return inputs[goalId + '_' + quarter] || { actual: '', status: 'not_started', completion_date: '' }
  }

  function setInput(goalId: string, field: string, value: string) {
    const key = goalId + '_' + quarter
    setInputs(prev => ({ ...prev, [key]: { ...getInput(goalId), [field]: value } }))
  }

  async function saveCheckIn(goal: any) {
    const inp = getInput(goal.id)
    if (!inp.actual) return
    setSaving(goal.id)
    await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_id: goal.id,
        quarter,
        actual_achievement: Number(inp.actual),
        status: inp.status,
        completion_date: inp.completion_date || null,
      }),
    })
    setCheckIns(prev => ({
      ...prev,
      [goal.id + '_' + quarter]: {
        actual_achievement: Number(inp.actual),
        status: inp.status,
        quarter,
      }
    }))
    setSaving(null)
  }

  const activeQuarter = getActiveQuarter(cycle)
  const windowOpen = activeQuarter === quarter

  if (status === 'loading' || loading) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div>
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-gray-600 text-sm">
            &larr; Dashboard
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg font-semibold">My Check-ins</h1>
        </div>
        <select value={quarter} onChange={e => setQuarter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q}>{q}</option>)}
        </select>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        {goals.length === 0 ? (
          <div className="text-center py-16 bg-white border rounded-xl">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="font-medium text-gray-900 mb-2">No approved goals yet</h3>
            <p className="text-sm text-gray-400 mb-4">Goals must be approved by your manager before you can log check-ins.</p>
            <button onClick={() => router.push('/dashboard/goals')}
              className="text-blue-600 text-sm hover:underline">
              View my goals →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 text-sm text-blue-700">
              Logging actuals for <strong>{quarter}</strong> &middot; {goals.length} approved goals
              {activeQuarter && (
                <span className="ml-2 text-blue-500">&middot; Active window: {activeQuarter}</span>
              )}
            </div>

            {!windowOpen && activeQuarter && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 text-sm text-yellow-700">
                The active check-in window is <strong>{activeQuarter}</strong>. You are viewing {quarter} which is outside the current window. Inputs are disabled.
              </div>
            )}

            {!activeQuarter && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 text-sm text-yellow-700">
                No check-in window is currently open. Check back when the next quarter begins.
              </div>
            )}

            {goals.map(goal => {
              const inp = getInput(goal.id)
              const ci = checkIns[goal.id + '_' + quarter]
              const score = ci ? Math.round(computeScore(goal.uom_type, goal.target, ci.actual_achievement)) : null

              return (
                <div key={goal.id} className="bg-white border rounded-xl p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-xs text-gray-400 uppercase tracking-wide">{goal.thrust_area}</span>
                      <h3 className="font-medium text-gray-900 mt-0.5">{goal.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{goal.description}</p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="text-sm text-gray-400">Target</div>
                      <div className="text-xl font-semibold">{goal.target}</div>
                      <div className="text-xs text-gray-400">{goal.uom_type} &middot; {goal.weightage}%</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Actual achievement</label>
                      <input type="number" value={inp.actual}
                        onChange={e => setInput(goal.id, 'actual', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
                        placeholder="Enter actual"
                        disabled={!windowOpen} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Status</label>
                      <select value={inp.status}
                        onChange={e => setInput(goal.id, 'status', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
                        disabled={!windowOpen}>
                        <option value="not_started">Not started</option>
                        <option value="on_track">On track</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    {goal.uom_type === 'timeline' ? (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Completion date</label>
                        <input type="date" value={inp.completion_date}
                          onChange={e => setInput(goal.id, 'completion_date', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          disabled={!windowOpen} />
                      </div>
                    ) : score !== null ? (
                      <div className="flex items-end">
                        <div className="w-full border rounded-lg px-3 py-2 bg-gray-50">
                          <div className="text-xs text-gray-500">Progress score</div>
                          <div className={'text-xl font-semibold ' + (score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500')}>
                            {score}%
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {windowOpen && (
                    <div className="flex items-center gap-3">
                      <button onClick={() => saveCheckIn(goal)}
                        disabled={saving === goal.id || !inp.actual}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {saving === goal.id ? 'Saving...' : ci ? 'Update check-in' : 'Save check-in'}
                      </button>
                      {ci && (
                        <span className="text-xs text-green-600 font-medium">
                          Saved &middot; actual: {ci.actual_achievement}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}