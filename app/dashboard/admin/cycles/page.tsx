'use client'

import { useEffect, useState } from 'react'
import { useRequireRole } from '@/lib/auth-check'
import { useRouter } from 'next/navigation'

export default function CyclesPage() {
  const { status } = useRequireRole(['admin'])
  const router = useRouter()
  const [cycle, setCycle] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phase1_opens: '',
    q1_opens: '',
    q2_opens: '',
    q3_opens: '',
    q4_opens: '',
    is_active: true,
  })

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/cycles')
      .then(r => r.json())
      .then(d => {
        if (d?.id) {
          setCycle(d)
          setForm({
            name: d.name,
            phase1_opens: d.phase1_opens,
            q1_opens: d.q1_opens,
            q2_opens: d.q2_opens,
            q3_opens: d.q3_opens,
            q4_opens: d.q4_opens,
            is_active: d.is_active,
          })
        }
      })
  }, [status])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/cycles', {
      method: cycle ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: cycle?.id }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (status === 'loading') return null

  return (
    <div>
      <div className="border-b bg-white px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/admin')}
          className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
          &larr; Admin
        </button>
        <span className="text-gray-300">/</span>
        <h1 className="text-base font-semibold text-gray-900">Cycle Management</h1>
      </div>

      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-medium text-gray-900 mb-5 text-sm">Configure active goal cycle</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cycle name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                placeholder="e.g. FY 2025-26" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phase 1 opens</label>
                <input type="date" value={form.phase1_opens}
                  onChange={e => setForm({ ...form, phase1_opens: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Q1 check-in opens</label>
                <input type="date" value={form.q1_opens}
                  onChange={e => setForm({ ...form, q1_opens: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Q2 check-in opens</label>
                <input type="date" value={form.q2_opens}
                  onChange={e => setForm({ ...form, q2_opens: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Q3 check-in opens</label>
                <input type="date" value={form.q3_opens}
                  onChange={e => setForm({ ...form, q3_opens: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Q4 / Annual opens</label>
                <input type="date" value={form.q4_opens}
                  onChange={e => setForm({ ...form, q4_opens: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm" required />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input type="checkbox" id="is_active" checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active cycle</label>
              </div>
            </div>

            <div className="flex gap-3 pt-2 items-center">
              <button type="submit" disabled={saving}
                className="flex-1 bg-[#F97316] text-white rounded-md py-2 text-sm font-medium hover:bg-[#EA6C00] disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save cycle'}
              </button>
              {saved && <span className="text-green-600 text-sm font-medium">Saved!</span>}
            </div>
          </form>
        </div>

        {cycle && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mt-4">
            <h2 className="font-medium text-gray-900 mb-4 text-sm">Current cycle</h2>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Name', value: cycle.name },
                { label: 'Goal setting opens', value: cycle.phase1_opens },
                { label: 'Q1 opens', value: cycle.q1_opens },
                { label: 'Q2 opens', value: cycle.q2_opens },
                { label: 'Q3 opens', value: cycle.q3_opens },
                { label: 'Q4 opens', value: cycle.q4_opens },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-1">
                  <span className="text-gray-400">{row.label}</span>
                  <span className="font-medium text-gray-900">{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Status</span>
                <span className={'text-xs px-2 py-1 rounded-full ' + (cycle.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                  {cycle.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
