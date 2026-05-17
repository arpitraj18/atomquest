'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (session?.user) {
      setUser(session.user)
    } else {
      const stored = sessionStorage.getItem('atomquest_user')
      if (stored) setUser(JSON.parse(stored))
    }
  }, [session])

  useEffect(() => {
    const stored = sessionStorage.getItem('atomquest_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  if (!user && status === 'loading') return (
    <div className="flex items-center justify-center py-32">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  )

  if (!user) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">
        Welcome, {user.name}
      </h2>
      <p className="text-gray-500 text-sm mb-8">
        {user.department} &middot; {user.role}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {user.role === 'employee' && (
          <>
            <DashCard title="My Goals" desc="View and manage your goal sheet" href="/dashboard/goals" color="blue" />
            <DashCard title="My Check-ins" desc="Log quarterly achievement updates" href="/dashboard/goals/checkin" color="green" />
          </>
        )}

        {user.role === 'manager' && (
          <>
            <DashCard title="Team Goals" desc="Review and approve team submissions" href="/dashboard/manager" color="blue" />
            <DashCard title="Check-ins" desc="View planned vs actual for your team" href="/dashboard/manager/checkin" color="green" />
          </>
        )}

        {user.role === 'admin' && (
          <>
            <DashCard title="Admin Panel" desc="Manage cycles, users and exceptions" href="/dashboard/admin" color="purple" />
            <DashCard title="Reports" desc="Achievement reports and CSV export" href="/dashboard/reports" color="blue" />
            <DashCard title="Analytics" desc="QoQ trends and completion heatmaps" href="/dashboard/analytics" color="green" />
            <DashCard title="Completion Dashboard" desc="Track quarterly check-in completion" href="/dashboard/admin/completion" color="gray" />
            <DashCard title="Push Shared Goal" desc="Push a KPI to multiple employees" href="/dashboard/admin/shared" color="purple" />
            <DashCard title="Escalations" desc="View and manage escalation rules" href="/dashboard/admin/escalations" color="gray" />
          </>
        )}

        <DashCard title="Audit Trail" desc="View all goal change history" href="/dashboard/admin" color="gray" />
      </div>
    </div>
  )
}

function DashCard({ title, desc, href, color }: { title: string, desc: string, href: string, color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    green: 'bg-green-50 border-green-200 hover:bg-green-100',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    gray: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
  }

  return (
    <a href={href} className={'block border rounded-xl p-5 transition-colors ' + (colorMap[color] || colorMap.gray)}>
      <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </a>
  )
}