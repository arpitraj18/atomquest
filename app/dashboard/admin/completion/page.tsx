'use client'

import { useRequireRole } from '@/lib/auth-check'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CompletionDashboard() {
  const { status } = useRequireRole(['admin'])
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [checkIns, setCheckIns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [quarter, setQuarter] = useState('Q1')

  useEffect(() => {
    if (status !== 'authenticated') return
    Promise.all([
      fetch('/api/users/all').then(r => r.json()),
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/checkins').then(r => r.json()),
    ]).then(([u, g, c]) => {
      setUsers(Array.isArray(u) ? u : [])
      setGoals(Array.isArray(g) ? g : [])
      setCheckIns(Array.isArray(c) ? c : [])
      setLoading(false)
    })
  }, [status])

  function employeeCheckInStatus(userId: string, q: string) {
    const userGoals = goals.filter(g => g.employee_id === userId && g.status === 'approved')
    if (userGoals.length === 0) return 'no_goals'
    const completed = userGoals.every(g => checkIns.some(c => c.goal_id === g.id && c.quarter === q))
    return completed ? 'completed' : 'pending'
  }

  function managerCheckInStatus(managerId: string, q: string) {
    const teamGoals = goals.filter(g => {
      const emp = users.find(u => u.id === g.employee_id)
      return emp?.manager_id === managerId && g.status === 'approved'
    })
    if (teamGoals.length === 0) return 'no_team'
    const completed = teamGoals.every(g =>
      checkIns.some(c => c.goal_id === g.id && c.quarter === q && c.manager_comment)
    )
    return completed ? 'completed' : 'pending'
  }

  const statusBadge = (s: string) => {
    if (s === 'completed') return 'bg-green-100 text-green-700'
    if (s === 'pending') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-500'
  }

  const statusLabel = (s: string) => {
    if (s === 'completed') return 'Done'
    if (s === 'pending') return 'Pending'
    if (s === 'no_goals') return 'No goals'
    if (s === 'no_team') return 'No team'
    return s
  }

  const employees = users.filter(u => u.role === 'employee')
  const managers = users.filter(u => u.role === 'manager')
  const employeeDone = employees.filter(u => employeeCheckInStatus(u.id, quarter) === 'completed').length
  const managerDone = managers.filter(u => managerCheckInStatus(u.id, quarter) === 'completed').length

  if (status === 'loading' || loading) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  )

  return (
    <div>
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/admin')} className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
            &larr; Admin
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-base font-semibold text-gray-900">Completion Dashboard</h1>
        </div>
        <select value={quarter} onChange={e => setQuarter(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm">
          {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q}>{q}</option>)}
        </select>
      </div>

      <div className="max-w-5xl mx-auto p-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Employees done</div>
            <div className="text-2xl font-semibold text-green-600">{employeeDone} / {employees.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Managers done</div>
            <div className="text-2xl font-semibold text-[#F97316]">{managerDone} / {managers.length}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Employee completion</div>
            <div className="text-2xl font-semibold text-gray-900">
              {employees.length > 0 ? Math.round((employeeDone / employees.length) * 100) : 0}%
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Quarter</div>
            <div className="text-2xl font-semibold text-gray-900">{quarter}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="font-medium text-gray-900 text-sm">Employee check-ins</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium text-xs uppercase tracking-wide">Employee</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium text-xs uppercase tracking-wide">Department</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium text-xs uppercase tracking-wide">{quarter}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map(u => {
                  const s = employeeCheckInStatus(u.id, quarter)
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                      <td className="px-4 py-3 text-gray-400">{u.department}</td>
                      <td className="px-4 py-3">
                        <span className={'text-xs px-2 py-1 rounded-full ' + statusBadge(s)}>
                          {statusLabel(s)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="font-medium text-gray-900 text-sm">Manager check-ins</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium text-xs uppercase tracking-wide">Manager</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium text-xs uppercase tracking-wide">Department</th>
                  <th className="text-left px-4 py-2 text-gray-400 font-medium text-xs uppercase tracking-wide">{quarter}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {managers.map(u => {
                  const s = managerCheckInStatus(u.id, quarter)
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                      <td className="px-4 py-3 text-gray-400">{u.department}</td>
                      <td className="px-4 py-3">
                        <span className={'text-xs px-2 py-1 rounded-full ' + statusBadge(s)}>
                          {statusLabel(s)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
