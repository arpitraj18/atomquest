'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useRequireRole } from '@/lib/auth-check'
import { Toast, useToast } from '@/components/Toast'

const THRUST_AREAS = [
  'Revenue Growth',
  'Cost Optimisation',
  'Customer Experience',
  'People & Culture',
  'Operational Excellence',
  'Innovation',
  'Compliance & Risk',
]

export default function EditGoalPage() {
  const { status } = useRequireRole(['employee'])
  const router = useRouter()
  const params = useParams()
  const goalId = params.id as string
  const { toast, showToast, hideToast } = useToast()

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    thrust_area: THRUST_AREAS[0],
    title: '',
    description: '',
    uom_type: 'min',
    target: '',
    weightage: '',
  })

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/goals/' + goalId)
      .then(r => r.json())
      .then(goal => {
        if (!goal || goal.status !== 'returned') {
          router.replace('/dashboard/goals')
          return
        }
        setForm({
          thrust_area: goal.thrust_area || THRUST_AREAS[0],
          title: goal.title || '',
          description: goal.description || '',
          uom_type: goal.uom_type || 'min',
          target: goal.target?.toString() || '',
          weightage: goal.weightage?.toString() || '',
        })
        setLoading(false)
      })
      .catch(() => router.replace('/dashboard/goals'))
  }, [status, goalId, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (Number(form.weightage) < 10) {
      setError('Weightage must be at least 10%.')
      return
    }

    setSaving(true)
    const res = await fetch('/api/goals/' + goalId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thrust_area: form.thrust_area,
        title: form.title,
        description: form.description,
        uom_type: form.uom_type,
        target: Number(form.target),
        weightage: Number(form.weightage),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to save goal')
      setSaving(false)
      return
    }
    showToast('Goal updated successfully!')
    setTimeout(() => router.push('/dashboard/goals'), 1000)
  }

  if (status === 'loading' || loading) return null

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="border-b bg-white px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/goals')}
          className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
          &larr; My Goals
        </button>
        <span className="text-gray-300">/</span>
        <h1 className="text-base font-semibold text-gray-900">Edit Goal</h1>
      </div>

      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-5 p-3 bg-orange-50 border border-orange-100 rounded-lg text-sm text-gray-600">
            This goal was returned for rework. Update the fields below and save.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thrust area</label>
              <select value={form.thrust_area}
                onChange={e => setForm({ ...form, thrust_area: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm">
                {THRUST_AREAS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal title</label>
              <input value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                placeholder="e.g. Increase sales revenue" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm" rows={3}
                placeholder="Describe this goal..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit of measurement</label>
                <select value={form.uom_type}
                  onChange={e => setForm({ ...form, uom_type: e.target.value })}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm">
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
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  placeholder="e.g. 1000000" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weightage %</label>
              <input type="number" value={form.weightage}
                onChange={e => setForm({ ...form, weightage: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                placeholder="e.g. 20" min={10} required />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded px-3 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex-1 bg-[#F97316] text-white rounded-md py-2.5 text-sm font-medium hover:bg-[#EA6C00] disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button type="button" onClick={() => router.push('/dashboard/goals')}
                className="flex-1 border border-gray-200 rounded-md py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
