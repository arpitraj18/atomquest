'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireRole } from '@/lib/auth-check'

const THRUST_AREAS = [
  'Revenue Growth',
  'Cost Optimisation',
  'Customer Experience',
  'People & Culture',
  'Operational Excellence',
  'Innovation',
  'Compliance & Risk',
]

export default function NewGoalPage() {
  const { user, status } = useRequireRole(['employee'])
  const router = useRouter()
  const [cycleId, setCycleId] = useState('')
  const [existingGoals, setExistingGoals] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dataLoaded, setDataLoaded] = useState(false)
  const [form, setForm] = useState({
    thrust_area: THRUST_AREAS[0],
    title: '',
    description: '',
    uom_type: 'min',
    target: '',
    weightage: '',
  })

  const userEmail = (user as any)?.email || ''

  useEffect(() => {
    if (status !== 'authenticated' || !userEmail || dataLoaded) return
    setDataLoaded(true)

    fetch('/api/users?email=' + encodeURIComponent(userEmail))
      .then(r => r.json())
      .then(u => {
        if (u?.id) {
          fetch('/api/goals?employee_id=' + u.id)
            .then(r => r.json())
            .then(d => setExistingGoals(Array.isArray(d) ? d : []))
        }
      })

    fetch('/api/cycles')
      .then(r => r.json())
      .then(d => { if (d?.id) setCycleId(d.id) })
  }, [status, userEmail, dataLoaded])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!userEmail) {
      setError('Session error — please sign out and sign in again.')
      return
    }

    if (Number(form.weightage) < 10) {
      setError('Weightage must be at least 10%.')
      return
    }

    if (existingGoals.length >= 8) {
      setError('You cannot have more than 8 goals.')
      return
    }

    setSaving(true)
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goals: [{ ...form, target: Number(form.target), weightage: Number(form.weightage) }],
        employee_email: userEmail,
        cycle_id: cycleId || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to save goal')
      setSaving(false)
      return
    }
    router.push('/dashboard/goals')
  }

  const remainingWeight = 100 - existingGoals.reduce((s, g) => s + Number(g.weightage), 0)

  if (status === 'loading') return null

  return (
    <div>
      <div className="border-b bg-white px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/goals')}
          className="text-gray-400 hover:text-gray-600 text-sm">
          &larr; My Goals
        </button>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-semibold">Add Goal</h1>
      </div>

      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white border rounded-xl p-6">
          <div className="mb-5 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-center justify-between">
            <span>Goals: {existingGoals.length} / 8 &nbsp;&middot;&nbsp; Remaining weightage: {remainingWeight}%</span>
            <span className="text-blue-400 text-xs">{userEmail}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thrust area</label>
              <select value={form.thrust_area}
                onChange={e => setForm({ ...form, thrust_area: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                {THRUST_AREAS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal title</label>
              <input value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Increase sales revenue" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
                placeholder="Describe this goal..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit of measurement</label>
                <select value={form.uom_type}
                  onChange={e => setForm({ ...form, uom_type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="min">Numeric — higher is better</option>
                  <option value="max">Numeric — lower is better</option>
                  <option value="timeline">Timeline — date based</option>
                  <option value="zero">Zero based — 0 is success</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                <input type="number" value={form.target}
                  onChange={e => setForm({ ...form, target: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. 1000000" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weightage % <span className="text-gray-400 font-normal">(min 10%, remaining: {remainingWeight}%)</span>
              </label>
              <input type="number" value={form.weightage}
                onChange={e => setForm({ ...form, weightage: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. 20" min={10} required />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving || !userEmail}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save goal'}
              </button>
              <button type="button" onClick={() => router.push('/dashboard/goals')}
                className="flex-1 border rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}