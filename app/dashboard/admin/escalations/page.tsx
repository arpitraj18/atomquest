'use client'

import { useEffect, useState } from 'react'
import { useRequireRole } from '@/lib/auth-check'
import { useRouter } from 'next/navigation'

export default function EscalationsPage() {
  const { status } = useRequireRole(['admin'])
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<string[]>([])

  useEffect(() => {
    if (status !== 'authenticated') return
    Promise.all([
      fetch('/api/escalations').then(r => r.json()),
      fetch('/api/escalations/rules').then(r => r.json()),
    ]).then(([e, r]) => {
      setLogs(Array.isArray(e) ? e : [])
      setRules(Array.isArray(r) ? r : [])
      setLoading(false)
    })
  }, [status])

  async function runEscalations() {
    setRunning(true)
    setResults([])
    const res = await fetch('/api/cron/escalate', { method: 'POST' })
    const data = await res.json()
    setResults(data.results || [])
    const updated = await fetch('/api/escalations').then(r => r.json())
    setLogs(Array.isArray(updated) ? updated : [])
    setRunning(false)
  }

  async function updateRule(id: string, days: number, active: boolean) {
    await fetch('/api/escalations/rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, days_threshold: days, is_active: active }),
    })
    setRules(prev => prev.map(r => r.id === id ? { ...r, days_threshold: days, is_active: active } : r))
  }

  const ruleLabel: Record<string, string> = {
    goal_not_submitted: 'Employee has not submitted goals',
    goal_not_approved: 'Manager has not approved goals',
    checkin_not_done: 'Quarterly check-in not completed',
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
          <button onClick={() => router.push('/dashboard/admin')} className="text-gray-400 hover:text-gray-600 text-sm">
            &larr; Admin
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg font-semibold">Escalation Module</h1>
        </div>
        <button onClick={runEscalations} disabled={running}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
          {running ? 'Running...' : 'Run escalations now'}
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-8 space-y-6">
        {results.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h3 className="font-medium text-yellow-800 mb-2">Results</h3>
            {results.map((r, i) => <p key={i} className="text-sm text-yellow-700">{r}</p>)}
          </div>
        )}

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b bg-gray-50">
            <h2 className="font-medium text-gray-900">Escalation rules</h2>
            <p className="text-sm text-gray-500 mt-0.5">Configure thresholds for automatic escalation</p>
          </div>
          <div className="divide-y">
            {rules.map(rule => (
              <div key={rule.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{ruleLabel[rule.rule_type] || rule.rule_type}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Triggers after N days of inaction</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Days</label>
                    <input type="number" value={rule.days_threshold}
                      onChange={e => updateRule(rule.id, Number(e.target.value), rule.is_active)}
                      className="w-16 border rounded-lg px-2 py-1 text-sm" min={1} />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={rule.is_active}
                      onChange={e => updateRule(rule.id, rule.days_threshold, e.target.checked)} />
                    <span className="text-xs text-gray-600">Active</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b bg-gray-50">
            <h2 className="font-medium text-gray-900">Escalation log</h2>
            <p className="text-sm text-gray-500 mt-0.5">{logs.length} total escalations</p>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Rule</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Triggered</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Levels notified</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Resolved</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No escalations yet</td>
                </tr>
              ) : logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{ruleLabel[log.rule_type] || log.rule_type}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(log.triggered_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{log.notified_levels}</td>
                  <td className="px-4 py-3">
                    {log.resolved_at
                      ? <span className="text-green-600 text-xs">Resolved</span>
                      : <span className="text-yellow-600 text-xs">Pending</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}