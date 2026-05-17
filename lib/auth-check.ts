'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export function useRequireRole(allowedRoles: string[]) {
  const { data: session, status } = useSession()
  const user = session?.user as any

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      window.location.href = '/'
      return
    }
    if (user?.role && !allowedRoles.includes(user.role)) {
      window.location.href = '/dashboard'
    }
  }, [status, user?.role])

  return { user, status }
}