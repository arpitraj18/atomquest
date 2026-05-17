'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function GoalDetailPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const [goal, setGoal] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status !== 'authenticated') return
    if (!params?.id || params.id === 'new') {
      router.push('/dashboard/goals/new')
      return
    }
    fetch('/api/goals/' + params.id)
      .then(r => r.json())
      .then(data => {
        setGoal(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [status, params?.id])

  if (status === 'loading' || loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  if (!goal) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Goal not found.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard/goals" className="text-gray-400 hover:text-gray-600 text-sm">← My Goals</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-semibold">{goal.title}</h1>
      </nav>

      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <div>
            <div className="text-xs text-gray-400 uppercase mb-1">{goal.thrust_area}</div>
            <h2 className="text-xl font-semibold text-gray-900">{goal.title}</h2>
            <p className="text-gray-500 mt-1">{goal.description}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <div className="text-xs text-gray-500 mb-1">UoM Type</div>
              <div className="font-medium capitalize">{goal.uom_type}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Target</div>
              <div className="font-medium">{goal.target}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Weightage</div>
              <div className="font-medium">{goal.weightage}%</div>
            </div>
          </div>
          <div className="pt-4 border-t">
            <div className="text-xs text-gray-500 mb-1">Status</div>
            <span className="text-sm font-medium capitalize">{goal.status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}