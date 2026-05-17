'use client'

import { useEffect, useState } from 'react'
import { useRequireRole } from '@/lib/auth-check'
import { useRouter } from 'next/navigation'
import { computeScore } from '@/lib/scoring'

export default function ReportsPage() {
  const { status } = useRequireRole(['admin'])
  const router = useRouter()
  const [goals, setGoals] = useState<any[]>([])
  const [checkIns, setCheckIns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status !== 'authenticated') return
    Promise.all([
      fetch('/api/goals').then(r => r.json()),
      fetch('/api/checkins').then(r => r.json()),
    ]).then(([g, c]) => {
      setGoals(Array.isArray(g) ? g : [])
      setCheckIns(Array.isArray(c) ? c : [])
      setLoading(false)
    })
  }, [status])

  function exportCSV() {
    const rows = [['Employee', 'Department', 'Goal', 'Thrust Area', 'UoM', 'Target', 'Weightage', 'Status', 'Q1 Actual', 'Q1 Score', 'Q2 Actual', 'Q2 Score', 'Q3 Actual', 'Q3 Score', 'Q4 Actual', 'Q4 Score']]

    goals.forEach(goal => {
      const getCI = (q: string) => checkIns.find(c => c.goal_id === goal.id && c.quarter === q)
      const score = (q: string) => {
        const ci = getCI(q)
        if (!ci) return ''
        return Math.round(computeScore(goal.uom_type, goal.target, ci.actual_achievement)) + '%'
      }
      rows.push([
        goal.employee?.name || '',
        goal.employee?.department || '',
        goal.title,
        goal.thrust_area,
        goal.uom_type,
        goal.target,
        goal.weightage + '%',
        goal.status,
        getCI('Q1')?.actual_achievement || '',
        score('Q1'),
        getCI('Q2')?.actual_achievement || '',
        score('Q2'),
        getCI('Q3')?.actual_achievement || '',
        score('Q3'),
        getCI('Q4')?.actual_achievement || '',
        score('Q4'),
      ])
    })

    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'achievement_report.csv'
    a.click()
    URL.revokeObjectURL(url)
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
          <h1 className="text-lg font-semibold">Achievement Report</h1>
        </div>
        <button onClick={exportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
          Export CSV
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-white border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Employee</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Goal</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">UoM</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Target</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Weight</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Q1</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Q2</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Q3</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Q4</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {goals.map(goal => {
                const getCI = (q: string) => checkIns.find(c => c.goal_id === goal.id && c.quarter === q)
                const scoreCell = (q: string) => {
                  const ci = getCI(q)
                  if (!ci) return <td key={q} className="px-4 py-3 text-gray-300">—</td>
                  const s = Math.round(computeScore(goal.uom_type, goal.target, ci.actual_achievement))
                  return (
                    <td key={q} className="px-4 py-3">
                      <div className="font-medium">{ci.actual_achievement}</div>
                      <div className={'text-xs ' + (s >= 80 ? 'text-green-600' : s >= 50 ? 'text-yellow-600' : 'text-red-500')}>
                        {s}%
                      </div>
                    </td>
                  )
                }
                return (
                  <tr key={goal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{goal.employee?.name}</div>
                      <div className="text-xs text-gray-400">{goal.employee?.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{goal.title}</div>
                      <div className="text-xs text-gray-400">{goal.thrust_area}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{goal.uom_type}</td>
                    <td className="px-4 py-3">{goal.target}</td>
                    <td className="px-4 py-3">{goal.weightage}%</td>
                    {scoreCell('Q1')}
                    {scoreCell('Q2')}
                    {scoreCell('Q3')}
                    {scoreCell('Q4')}
                    <td className="px-4 py-3 capitalize">{goal.status}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}