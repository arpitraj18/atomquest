'use client'

import { useRequireRole } from '@/lib/auth-check'
import { useEffect, useState } from 'react'
import { Goal } from '@/types'
import { Toast, useToast } from '@/components/Toast'

export default function GoalsPage() {
    const { user, status } = useRequireRole(['employee'])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const { toast, showToast, hideToast } = useToast()

  useEffect(() => {
    if (status !== 'authenticated') return
    const email = user?.email
    if (!email) return

    fetch('/api/users?email=' + encodeURIComponent(email))
      .then(r => r.json())
      .then(u => {
        if (!u?.id) { setLoading(false); return }
        fetch('/api/goals?employee_id=' + u.id)
          .then(r => r.json())
          .then(data => {
            setGoals(Array.isArray(data) ? data : [])
            setLoading(false)
          })
          .catch(() => setLoading(false))
      })
      .catch(() => setLoading(false))
  }, [status, user?.email])

  const totalWeight = goals.reduce((s, g) => s + Number(g.weightage), 0)

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    returned: 'bg-red-100 text-red-700',
  }

  async function submitAll() {
    const total = goals.reduce((s, g) => s + Number(g.weightage), 0)
    if (Math.round(total) !== 100) {
      showToast('Total weightage must equal 100%. Currently: ' + total + '%', 'error')
      return
    }
    for (const g of goals.filter(x => x.status === 'draft')) {
      await fetch('/api/goals/' + g.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'submitted' }),
      })
    }
    setGoals(prev => prev.map(g => g.status === 'draft' ? { ...g, status: 'submitted' as any } : g))
    showToast('All goals submitted for approval successfully!')
  }

  async function submitOne(goalId: string) {
    const total = goals.reduce((s, g) => s + Number(g.weightage), 0)
    if (Math.round(total) !== 100) {
      showToast('Total weightage must equal 100%. Currently: ' + total + '%', 'error')
      return
    }
    await fetch('/api/goals/' + goalId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'submitted' }),
    })
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: 'submitted' as any } : g))
    showToast('Goal submitted for approval!')
  }

  async function deleteGoal(goalId: string, title: string) {
    if (!confirm('Are you sure you want to delete "' + title + '"? This cannot be undone.')) return
    await fetch('/api/goals/' + goalId, { method: 'DELETE' })
    setGoals(prev => prev.filter(g => g.id !== goalId))
    showToast('Goal deleted.')
  }

  if (status === 'loading') return null

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
            &larr; Dashboard
          </a>
          <span className="text-gray-300">/</span>
          <h1 className="text-base font-semibold text-gray-900">My Goals</h1>
        </div>
        {!loading && goals.length < 8 && (
          <a href="/dashboard/goals/new"
            className="bg-[#F97316] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#EA6C00] transition-colors">
            + Add Goal
          </a>
        )}
      </div>

      <div className="max-w-5xl mx-auto p-8">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-48 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Total goals</div>
                <div className="text-2xl font-semibold text-gray-900">{goals.length} / 8</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Total weightage</div>
                <div className={'text-2xl font-semibold ' + (totalWeight === 100 ? 'text-green-600' : 'text-red-500')}>
                  {totalWeight}%
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Status</div>
                <div className="text-2xl font-semibold text-gray-900 capitalize">
                  {goals.length === 0 ? 'No goals' : goals[0]?.status}
                </div>
              </div>
            </div>

            {totalWeight !== 100 && goals.length > 0 && goals.some(g => g.status === 'draft') && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                Total weightage is {totalWeight}%. Add more goals or adjust weightages to reach 100% before submitting.
              </div>
            )}

            {goals.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">No goals yet</h3>
                <p className="text-gray-400 text-sm mb-6">Start by adding your first goal. You can add up to 8 goals with a total weightage of 100%.</p>
                <a href="/dashboard/goals/new"
                  className="bg-[#F97316] text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-[#EA6C00] transition-colors">
                  + Add your first goal
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map(goal => (
                  <div key={goal.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs text-gray-400 uppercase tracking-wide">{goal.thrust_area}</span>
                          <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + statusColor[goal.status]}>
                            {goal.status}
                          </span>
                          {(goal as any).shared_from_goal_id && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                              shared
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{goal.title}</h3>
                        <p className="text-sm text-gray-400">{goal.description}</p>
                      </div>
                      <div className="text-right ml-6 flex-shrink-0">
                        <div className="text-2xl font-semibold text-gray-900">{goal.weightage}%</div>
                        <div className="text-xs text-gray-400 mt-0.5">Target: {goal.target}</div>
                        <div className="text-xs text-gray-400">({goal.uom_type})</div>
                      </div>
                    </div>

                    {(goal as any).shared_from_goal_id && goal.status === 'approved' && (
                      <SharedWeightageEditor
                        goal={goal}
                        onUpdate={(id, w) => setGoals(prev => prev.map(g => g.id === id ? { ...g, weightage: w } : g))}
                        onToast={showToast}
                      />
                    )}

                    {!goal.locked_at && goal.status === 'draft' && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                        <button
                          onClick={() => submitOne(goal.id)}
                          className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Submit for approval
                        </button>
                        <button
                          onClick={() => deleteGoal(goal.id, goal.title)}
                          className="border border-red-200 text-red-500 px-4 py-1.5 rounded-md text-sm hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}

                    {goal.status === 'returned' && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-red-500 mb-3">Returned for rework by your manager. Please revise and resubmit.</p>
                        <div className="flex gap-2">
                          <a href={"/dashboard/goals/" + goal.id + "/edit"}
                            className="bg-orange-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                            Edit goal
                          </a>
                          <button
                            onClick={async () => {
                              const total = goals.reduce((s, g) => s + Number(g.weightage), 0)
                              if (Math.round(total) !== 100) {
                                showToast('Total weightage must equal 100%. Currently: ' + total + '%', 'error')
                                return
                              }
                              await fetch('/api/goals/' + goal.id, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'submitted', locked_at: null }),
                              })
                              setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, status: 'submitted' as any } : g))
                              showToast('Goal resubmitted for approval!')
                            }}
                            className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                            Resubmit
                          </button>
                        </div>
                      </div>
                    )}

                    {goal.status === 'approved' && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></span>
                        <p className="text-sm text-green-600">Approved and locked. Contact admin to make changes.</p>
                      </div>
                    )}
                  </div>
                ))}

                {goals.some(g => g.status === 'draft') && (
                  <button
                    onClick={submitAll}
                    className="w-full bg-green-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Submit all draft goals for approval
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SharedWeightageEditor({ goal, onUpdate, onToast }: { goal: any, onUpdate: (id: string, w: number) => void, onToast: (msg: string) => void }) {
  const [weightage, setWeightage] = useState(goal.weightage.toString())
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await fetch('/api/goals/' + goal.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightage: Number(weightage) }),
    })
    onUpdate(goal.id, Number(weightage))
    setSaving(false)
    onToast('Weightage updated!')
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
      <span className="text-xs text-gray-500">Your weightage for this shared goal:</span>
      <input
        type="number"
        value={weightage}
        onChange={e => setWeightage(e.target.value)}
        className="w-20 border border-gray-200 rounded px-2 py-1 text-sm"
        min={10}
        max={100}
      />
      <span className="text-xs text-gray-400">%</span>
      <button onClick={save} disabled={saving}
        className="bg-[#F97316] text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-[#EA6C00] disabled:opacity-50 transition-colors">
        {saving ? 'Saving...' : 'Update'}
      </button>
    </div>
  )
}
