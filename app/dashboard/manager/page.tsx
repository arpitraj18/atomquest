'use client'

import { useRequireRole } from '@/lib/auth-check'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ManagerPage() {
  const { user, status } = useRequireRole(['manager'])
  const router = useRouter()
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<Record<string, { target: string, weightage: string }>>({})

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/users?email=' + encodeURIComponent(user?.email))
      .then(r => r.json())
      .then(u => {
        if (!u?.id) { setLoading(false); return }
        fetch('/api/goals?manager_id=' + u.id)
          .then(r => r.json())
          .then(data => {
            setGoals(Array.isArray(data) ? data : [])
            setLoading(false)
          })
          .catch(() => setLoading(false))
      })
      .catch(() => setLoading(false))
  }, [status, user?.email])

  async function updateGoal(goalId: string, newStatus: string, managerComment?: string) {
    const body: any = { status: newStatus }
    if (managerComment) body.manager_comment = managerComment
    if (newStatus === 'approved') body.locked_at = new Date().toISOString()
    if (editing[goalId]) {
      body.target = Number(editing[goalId].target)
      body.weightage = Number(editing[goalId].weightage)
    }

    await fetch('/api/goals/' + goalId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setGoals(prev => prev.map(g => g.id === goalId ? {
      ...g,
      status: newStatus,
      target: editing[goalId] ? Number(editing[goalId].target) : g.target,
      weightage: editing[goalId] ? Number(editing[goalId].weightage) : g.weightage,
    } : g))
    setEditing(prev => { const n = { ...prev }; delete n[goalId]; return n })
  }

  function startEdit(goal: any) {
    setEditing(prev => ({ ...prev, [goal.id]: { target: goal.target.toString(), weightage: goal.weightage.toString() } }))
  }

  const grouped = goals.reduce((acc, goal) => {
    const empId = goal.employee_id
    if (!acc[empId]) acc[empId] = { employee: goal.employee, goals: [] }
    acc[empId].goals.push(goal)
    return acc
  }, {} as Record<string, { employee: any, goals: any[] }>)

  const statusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    returned: 'bg-red-100 text-red-700',
  }

  if (status === 'loading' || loading) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div>
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm">
            &larr; Dashboard
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg font-semibold">Team Goals</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/manager/checkin')}
            className="text-sm text-blue-600 hover:underline">
            Quarterly check-ins
          </button>
          <span className="text-sm text-gray-500">{goals.length} total goals</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-8">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 bg-white border rounded-xl">
            <p className="text-gray-400">No team goals found.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.values(grouped).map((group: any) => (
              <div key={group.employee?.id} className="bg-white border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
                  <div>
                    <h2 className="font-medium text-gray-900">{group.employee?.name}</h2>
                    <p className="text-sm text-gray-500">{group.employee?.department} &middot; {group.employee?.email}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {group.goals.length} goals &middot; {group.goals.reduce((s: number, g: any) => s + Number(g.weightage), 0)}% total
                  </div>
                </div>

                <div className="divide-y">
                  {group.goals.map((goal: any) => {
                    const isEditing = !!editing[goal.id]
                    return (
                      <div key={goal.id} className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-400 uppercase">{goal.thrust_area}</span>
                              <span className={'text-xs px-2 py-0.5 rounded-full ' + statusColor[goal.status]}>
                                {goal.status}
                              </span>
                            </div>
                            <h3 className="font-medium text-gray-900">{goal.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
                          </div>
                          <div className="text-right ml-4 flex-shrink-0">
                            {isEditing ? (
                              <div className="space-y-2">
                                <div>
                                  <label className="text-xs text-gray-400">Target</label>
                                  <input type="number" value={editing[goal.id].target}
                                    onChange={e => setEditing(prev => ({ ...prev, [goal.id]: { ...prev[goal.id], target: e.target.value } }))}
                                    className="w-24 border rounded px-2 py-1 text-sm block" />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-400">Weightage %</label>
                                  <input type="number" value={editing[goal.id].weightage}
                                    onChange={e => setEditing(prev => ({ ...prev, [goal.id]: { ...prev[goal.id], weightage: e.target.value } }))}
                                    className="w-24 border rounded px-2 py-1 text-sm block" />
                                </div>
                                <button onClick={() => setEditing(prev => { const n = { ...prev }; delete n[goal.id]; return n })}
                                  className="text-xs text-gray-400 hover:text-gray-600">Cancel edit</button>
                              </div>
                            ) : (
                              <>
                                <div className="text-lg font-semibold">{goal.weightage}%</div>
                                <div className="text-xs text-gray-400">Target: {goal.target} ({goal.uom_type})</div>
                              </>
                            )}
                          </div>
                        </div>

                        {goal.status === 'submitted' && (
                          <div className="mt-3 pt-3 border-t space-y-3">
                            {!isEditing && (
                              <button onClick={() => startEdit(goal)} className="text-xs text-blue-600 hover:underline">
                                Edit target / weightage before approving
                              </button>
                            )}
                            <textarea
                              placeholder="Add comment (optional)..."
                              value={comment[goal.id] || ''}
                              onChange={e => setComment(prev => ({ ...prev, [goal.id]: e.target.value }))}
                              className="w-full border rounded-lg px-3 py-2 text-sm resize-none" rows={2}
                            />
                            <div className="flex gap-2">
                              <button onClick={() => updateGoal(goal.id, 'approved', comment[goal.id])}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                                Approve
                              </button>
                              <button onClick={() => updateGoal(goal.id, 'returned', comment[goal.id])}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">
                                Return for rework
                              </button>
                            </div>
                          </div>
                        )}

                        {goal.status === 'approved' && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-sm text-green-600">Approved and locked</p>
                          </div>
                        )}

                        {goal.status === 'returned' && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-sm text-red-500">Returned for rework</p>
                          </div>
                        )}
                      </div>
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