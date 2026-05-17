'use client'

import { useEffect, useState } from 'react'
import { useRequireRole } from '@/lib/auth-check'
import { useRouter } from 'next/navigation'

const THRUST_AREAS = [
  'Revenue Growth', 'Cost Optimisation', 'Customer Experience',
  'People & Culture', 'Operational Excellence', 'Innovation', 'Compliance & Risk',
]

export default function SharedGoalsPage() {
  const { status } = useRequireRole(['admin'])
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [cycleId, setCycleId] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    thrust_area: THRUST_AREAS[0],
    title: '',
    description: '',
    uom_type: 'min',
    target: '',
  })

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/users/all').then(r => r.json()).then(u => {
      setUsers(Array.isArray(u) ? u.filter((x: any) => x.role === 'employee') : [])
    })
    fetch('/api/cycles').then(r => r.json()).then(d => { if (d?.id) setCycleId(d.id) })
  }, [status])

  function toggleEmployee(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (selected.length === 0) { setError('Please select at least one employee.'); return }
    if (!form.title || !form.target) { setError('Please fill in all required fields.'); return }

    setSaving(true)
    const res = await fetch('/api/shared-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        target: Number(form.target),
        cycle_id: cycleId || null,
        employee_ids: selected,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to push shared goal')
    } else {
      setSuccess(true)
      setSelected([])
      setForm({ thrust_area: THRUST_AREAS[0], title: '', description: '', uom_type: 'min', target: '' })
    }
    setSaving(false)
  }

  if (status === 'loading') return (
    <div className="flex items-center justify-center py-32">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  return (
    <div>
      <div className="border-b bg-white px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/admin')} className="text-gray-400 hover:text-gray-600 text-sm">
          &larr; Admin
        </button>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-semibold">Push Shared Goal</h1>
      </div>

      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 text-sm text-blue-700 mb-6">
          Shared goals are pushed directly to selected employees as approved goals. Recipients can only adjust weightage — title and target are read-only.
        </div>

        <div className="bg-white border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thrust area</label>
              <select value={form.thrust_area} onChange={e => setForm({ ...form, thrust_area: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                {THRUST_AREAS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Zero safety incidents" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
                placeholder="Describe this KPI..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit of measurement</label>
                <select value={form.uom_type} onChange={e => setForm({ ...form, uom_type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="min">Numeric — higher is better</option>
                  <option value="max">Numeric — lower is better</option>
                  <option value="timeline">Timeline — date based</option>
                  <option value="zero">Zero based — 0 is success</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                <input type="number" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 0" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select employees <span className="text-gray-400 font-normal">({selected.length} selected)</span>
              </label>
              <div className="border rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
                  <input type="checkbox"
                    checked={selected.length === users.length && users.length > 0}
                    onChange={() => setSelected(selected.length === users.length ? [] : users.map(u => u.id))}
                  />
                  <span className="text-sm text-gray-600">Select all</span>
                </div>
                {users.map(u => (
                  <div key={u.id} onClick={() => toggleEmployee(u.id)}
                    className={'flex items-center gap-3 px-4 py-3 cursor-pointer border-b last:border-0 hover:bg-gray-50 ' + (selected.includes(u.id) ? 'bg-blue-50' : '')}>
                    <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleEmployee(u.id)} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.department} &middot; {u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
            {success && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">Shared goal pushed successfully!</p>}

            <button type="submit" disabled={saving}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Pushing...' : 'Push shared goal to selected employees'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}