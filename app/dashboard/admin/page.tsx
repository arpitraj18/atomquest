'use client'

import { useRequireRole } from '@/lib/auth-check'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminPage() {
  const { status } = useRequireRole(['admin'])
  const router = useRouter()
  const [goals, setGoals] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (status !== 'authenticated') return
    Promise.all([
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/audit').then(r => r.json()),
      fetch('/api/users/all').then(r => r.json()),
    ]).then(([g, a, u]) => {
      setGoals(Array.isArray(g) ? g : [])
      setAuditLogs(Array.isArray(a) ? a : [])
      setUsers(Array.isArray(u) ? u : [])
      setLoading(false)
    })
  }, [status])

  async function unlockGoal(goalId: string) {
    await fetch('/api/goals/' + goalId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locked_at: null, status: 'draft' }),
    })
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, locked_at: null, status: 'draft' } : g))
  }

  if (status === 'loading' || loading) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  const statusCount = (s: string) => goals.filter(g => g.status === s).length

  return (
    <div>
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm">
            &larr; Dashboard
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg font-semibold">Admin Panel</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total users', value: users.length },
            { label: 'Total goals', value: goals.length },
            { label: 'Approved', value: statusCount('approved') },
            { label: 'Pending approval', value: statusCount('submitted') },
          ].map(card => (
            <div key={card.label} className="bg-white border rounded-xl p-4">
              <div className="text-sm text-gray-500 mb-1">{card.label}</div>
              <div className="text-2xl font-semibold">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 text-sm">Send check-in reminders</div>
            <div className="text-xs text-gray-500 mt-0.5">Email all employees to log their quarterly check-in</div>
          </div>
          <div className="flex items-center gap-2">
            <select id="reminder-quarter" className="border rounded-lg px-3 py-2 text-sm">
              {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q}>{q}</option>)}
            </select>
            <button
              onClick={async () => {
                const q = (document.getElementById('reminder-quarter') as HTMLSelectElement).value
                const res = await fetch('/api/notify/remind', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ quarter: q }),
                })
                const d = await res.json()
                alert('Sent ' + d.sent + ' reminder emails for ' + q)
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
            >
              Send reminders
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {['overview', 'audit', 'goals'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={'px-4 py-2 rounded-lg text-sm capitalize ' + (activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50')}>
              {tab}
            </button>
          ))}
          <Link href="/dashboard/admin/completion"
            className="px-4 py-2 rounded-lg text-sm bg-white border text-gray-600 hover:bg-gray-50">
            Completion dashboard
          </Link>
          <Link href="/dashboard/admin/shared"
            className="px-4 py-2 rounded-lg text-sm bg-white border text-gray-600 hover:bg-gray-50">
            Push shared goal
          </Link>
          <Link href="/dashboard/admin/escalations"
            className="px-4 py-2 rounded-lg text-sm bg-white border text-gray-600 hover:bg-gray-50">
            Escalations
          </Link>
          <Link href="/dashboard/admin/cycles"
            className="px-4 py-2 rounded-lg text-sm bg-white border text-gray-600 hover:bg-gray-50">
            Cycle management
          </Link>
        </div>

        {activeTab === 'overview' && (
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Role</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Department</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3 text-gray-500">{u.department}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Goal</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Employee</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Shared</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {goals.map((g: any) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{g.title}</td>
                    <td className="px-4 py-3 text-gray-500">{g.employee?.name}</td>
                    <td className="px-4 py-3 capitalize">{g.status}</td>
                    <td className="px-4 py-3">
                      {g.shared_from_goal_id && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">shared</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {g.locked_at && (
                        <button onClick={() => unlockGoal(g.id)}
                          className="text-blue-600 hover:underline text-xs">
                          Unlock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Time</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Changed by</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Entity</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Change</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Old status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">New status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No audit logs yet</td>
                  </tr>
                ) : auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{new Date(log.changed_at).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium">{log.changer?.name || 'System'}</td>
                    <td className="px-4 py-3">{log.entity_type}</td>
                    <td className="px-4 py-3">{log.change_type}</td>
                    <td className="px-4 py-3 text-gray-500">{log.old_value?.status || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{log.new_value?.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}