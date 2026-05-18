'use client'

import { useEffect, useState } from 'react'
import { useRequireRole } from '@/lib/auth-check'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { computeScore } from '@/lib/scoring'

const COLORS = ['#F97316', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnalyticsPage() {
  const { status } = useRequireRole(['admin'])
  const router = useRouter()
  const [goals, setGoals] = useState<any[]>([])
  const [checkIns, setCheckIns] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [anomalies, setAnomalies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status !== 'authenticated') return
    Promise.all([
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/checkins').then(r => r.json()),
      fetch('/api/users/all').then(r => r.json()),
      fetch('/api/ml/anomalies').then(r => r.json()),
    ]).then(([g, c, u, a]) => {
      setGoals(Array.isArray(g) ? g : [])
      setCheckIns(Array.isArray(c) ? c : [])
      setUsers(Array.isArray(u) ? u : [])
      setAnomalies(Array.isArray(a) ? a : [])
      setLoading(false)
    })
  }, [status])

  const qoqData = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
    const qCIs = checkIns.filter(c => c.quarter === q)
    if (qCIs.length === 0) return { quarter: q, avgScore: 0 }
    const scores = qCIs.map(ci => {
      const goal = goals.find(g => g.id === ci.goal_id)
      if (!goal) return 0
      return computeScore(goal.uom_type, goal.target, ci.actual_achievement)
    })
    return { quarter: q, avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }
  })

  const thrustData = Object.entries(
    goals.reduce((acc, g) => {
      acc[g.thrust_area] = (acc[g.thrust_area] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const statusData = ['draft', 'submitted', 'approved', 'returned'].map(s => ({
    name: s,
    count: goals.filter(g => g.status === s).length,
  })).filter(d => d.count > 0)

  const deptData = Object.entries(
    goals.reduce((acc, g) => {
      const dept = g.employee?.department || 'Unknown'
      if (!acc[dept]) acc[dept] = { total: 0, approved: 0 }
      acc[dept].total++
      if (g.status === 'approved') acc[dept].approved++
      return acc
    }, {} as Record<string, { total: number, approved: number }>)
  ).map(([dept, d]: any) => ({
    dept,
    completion: d.total > 0 ? Math.round((d.approved / d.total) * 100) : 0,
  }))

  const managers = users.filter(u => u.role === 'manager')
  const managerEffectiveness = managers.map(m => {
    const teamGoals = goals.filter(g => g.employee?.manager_id === m.id && g.status === 'approved')
    const checkedIn = teamGoals.filter(g =>
      checkIns.some(c => c.goal_id === g.id && c.manager_comment)
    ).length
    return {
      manager: m.name,
      rate: teamGoals.length > 0 ? Math.round((checkedIn / teamGoals.length) * 100) : 0,
    }
  })

  if (status === 'loading' || loading) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  )

  return (
    <div>
      <div className="border-b bg-white px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
          &larr; Dashboard
        </button>
        <span className="text-gray-300">/</span>
        <h1 className="text-base font-semibold text-gray-900">Analytics</h1>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="font-medium text-gray-900 mb-4 text-sm">Quarter-on-Quarter avg score</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={qoqData}>
                <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip formatter={(v: any) => v + '%'} />
                <Bar dataKey="avgScore" fill="#F97316" radius={[4, 4, 0, 0]} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="font-medium text-gray-900 mb-4 text-sm">Goals by thrust area</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={thrustData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                  {thrustData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="font-medium text-gray-900 mb-4 text-sm">Goal status distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Goals" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="font-medium text-gray-900 mb-4 text-sm">Approval rate by department</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData}>
                <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip formatter={(v: any) => v + '%'} />
                <Bar dataKey="completion" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Approval rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-medium text-gray-900 mb-4 text-sm">Manager check-in completion rate</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={managerEffectiveness}>
              <XAxis dataKey="manager" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip formatter={(v: any) => v + '%'} />
              <Bar dataKey="rate" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Check-in rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-900 text-sm">AI Anomaly Detection</h2>
            <span className="text-xs text-gray-400">Z-score &gt; 2.0 flagged</span>
          </div>
          {anomalies.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No employee data available. Run the seed route first.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Employee</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Avg Progress</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Score Variance</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Late Check-ins</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Max Spike</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {anomalies.map((emp: any) => (
                    <tr key={emp.user_id} className={'transition-colors ' + (emp.is_anomaly ? 'bg-red-50' : 'hover:bg-gray-50')}>
                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-900">{emp.name}</div>
                        <div className="text-xs text-gray-400">{emp.department}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-gray-700">{Math.round(emp.metrics.avg_progress * 100)}%</div>
                        <div className={'text-xs ' + (Math.abs(emp.z_scores.avg_progress) > 2 ? 'text-red-500 font-medium' : 'text-gray-400')}>
                          z={emp.z_scores.avg_progress}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-gray-700">{emp.metrics.score_variance}</div>
                        <div className={'text-xs ' + (Math.abs(emp.z_scores.score_variance) > 2 ? 'text-red-500 font-medium' : 'text-gray-400')}>
                          z={emp.z_scores.score_variance}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-gray-700">{emp.metrics.late_checkins}</div>
                        <div className={'text-xs ' + (Math.abs(emp.z_scores.late_checkins) > 2 ? 'text-red-500 font-medium' : 'text-gray-400')}>
                          z={emp.z_scores.late_checkins}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-gray-700">{Math.round(emp.metrics.max_quarter_spike * 100)}%</div>
                        <div className={'text-xs ' + (Math.abs(emp.z_scores.max_quarter_spike) > 2 ? 'text-red-500 font-medium' : 'text-gray-400')}>
                          z={emp.z_scores.max_quarter_spike}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {emp.is_anomaly ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                              Anomaly
                            </span>
                            <p className="text-xs text-red-500 mt-1 max-w-[180px]">{emp.reason}</p>
                          </div>
                        ) : (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
