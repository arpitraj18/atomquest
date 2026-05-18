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
  const [activeQuarter, setActiveQuarter] = useState('Q4')

  useEffect(() => {
    fetch('/api/cycles')
      .then(r => r.json())
      .then(cycle => {
        if (!cycle) return
        const now = new Date()
        if (now >= new Date(cycle.q4_opens)) setActiveQuarter('Q4')
        else if (now >= new Date(cycle.q3_opens)) setActiveQuarter('Q3')
        else if (now >= new Date(cycle.q2_opens)) setActiveQuarter('Q2')
        else setActiveQuarter('Q1')
      })
      .catch(() => {})
  }, [])

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
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  )

  const statusCount = (s: string) => goals.filter(g => g.status === s).length

  return (
    <div>
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
            &larr; Dashboard
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-base font-semibold text-gray-900">Admin Panel</h1>
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
            <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">{card.label}</div>
              <div className="text-2xl font-semibold text-gray-900">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 text-sm">Send check-in reminders</div>
            <div className="text-xs text-gray-400 mt-0.5">Email all employees to log their quarterly check-in</div>
          </div>
          <div className="flex items-center gap-2">
            <select value={activeQuarter} onChange={e => setActiveQuarter(e.target.value)} className="border border-gray-200 rounded px-3 py-2 text-sm">
              {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q}>{q}</option>)}
            </select>
            <button
              onClick={async () => {
                const res = await fetch('/api/notify/remind', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ quarter: activeQuarter }),
                })
                const d = await res.json()
                alert('Sent ' + d.sent + ' reminder emails for ' + activeQuarter)
              }}
              className="bg-[#F97316] text-white px-4 py-2 rounded-md text-sm hover:bg-[#EA6C00] transition-colors"
            >
              Send reminders
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {['overview', 'audit', 'goals'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={'px-4 py-2 rounded-md text-sm capitalize transition-colors ' + (activeTab === tab ? 'bg-[#F97316] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
              {tab}
            </button>
          ))}
          <Link href="/dashboard/admin/completion"
            className="px-4 py-2 rounded-md text-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Completion dashboard
          </Link>
          <Link href="/dashboard/admin/shared"
            className="px-4 py-2 rounded-md text-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Push shared goal
          </Link>
          <Link href="/dashboard/admin/escalations"
            className="px-4 py-2 rounded-md text-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Escalations
          </Link>
          <Link href="/dashboard/admin/cycles"
            className="px-4 py-2 rounded-md text-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Cycle management
          </Link>
        </div>

        {activeTab === 'overview' && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Department</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{u.role}</td>
                    <td className="px-4 py-3 text-gray-400">{u.department}</td>
                    <td className="px-4 py-3 text-gray-400">{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Goal</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Employee</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Shared</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {goals.map((g: any) => (
                  <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{g.title}</td>
                    <td className="px-4 py-3 text-gray-400">{g.employee?.name}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">{g.status}</td>
                    <td className="px-4 py-3">
                      {g.shared_from_goal_id && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">shared</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {g.locked_at && (
                        <button onClick={() => unlockGoal(g.id)}
                          className="text-[#F97316] hover:text-[#EA6C00] text-xs transition-colors">
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
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Time</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Changed by</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Entity</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Change</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">Old status</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">New status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No audit logs yet</td>
                  </tr>
                ) : auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{new Date(log.changed_at).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{log.changer?.name || 'System'}</td>
                    <td className="px-4 py-3 text-gray-600">{log.entity_type}</td>
                    <td className="px-4 py-3 text-gray-600">{log.change_type}</td>
                    <td className="px-4 py-3 text-gray-400">{log.old_value?.status || '-'}</td>
                    <td className="px-4 py-3 text-gray-400">{log.new_value?.status || '-'}</td>
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
