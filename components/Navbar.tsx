'use client'

import { signOut } from 'next-auth/react'
import { useTheme } from './ThemeProvider'
import Image from 'next/image'

export function Navbar({ user }: { user: any }) {
  const { theme, toggle } = useTheme()

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <a href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <Image src="/logo.png" alt="Atomberg logo" width={32} height={32} className="rounded-md" />
        <div>
          <span className="text-sm font-semibold text-gray-900">AtomQuest</span>
          <span className="text-xs text-gray-400 ml-2">by Atomberg</span>
        </div>
      </a>

      <div className="flex items-center gap-4">
        {user?.name && (
          <>
            <span className="text-sm text-gray-600">{user.name}</span>
            <span className="text-xs bg-orange-50 text-[#F97316] px-2 py-1 rounded-full capitalize font-medium border border-orange-100">
              {user.role}
            </span>
          </>
        )}

        <button
          onClick={toggle}
          className="text-xs border border-gray-200 rounded-md px-3 py-1.5 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>

        {user?.name && (
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sign out
          </button>
        )}
      </div>
    </nav>
  )
}
