'use client'

import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/Navbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const user = session?.user as any

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      {children}
    </div>
  )
}