'use client'

import { signOut } from 'next-auth/react'
import { useTheme } from './ThemeProvider'
import Image from 'next/image'

export function Navbar({ user }: { user: any }) {
  const { theme, toggle } = useTheme()

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <a href="/dashboard" className="flex items-center gap-3 hover:opacity-80">
        <Image src="/logo.png" alt="Atomberg logo" width={36} height={36} className="rounded-lg" />
        <div>
          <span className="text-base font-semibold text-gray-900">AtomQuest</span>
          <span className="text-xs text-gray-400 ml-2">by Atomberg</span>
        </div>
      </a>

      <div className="flex items-center gap-4">
        {user?.name && (
          <>
            <span className="text-sm text-gray-600">{user.name}</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full capitalize">
              {user.role}
            </span>
          </>
        )}

        <button
          onClick={toggle}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50"
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>

        {user?.name && (
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        )}
      </div>
    </nav>
  )
}