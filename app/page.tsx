'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTheme } from '@/components/ThemeProvider'

export default function LoginPage() {
  const router = useRouter()
  const { theme, toggle } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    if (result?.error) {
      setError('Invalid email or password.')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  async function quickLogin(demoEmail: string, role: string) {
    setLoading(true)
    const result = await signIn('credentials', {
      email: demoEmail,
      password: role + '@atomberg',
      redirect: false,
    })
    if (!result?.error) router.push('/dashboard')
    setLoading(false)
  }

  const demoAccounts = [
    {
      label: 'Employee',
      email: 'employee@demo.com',
      role: 'employee',
      desc: 'Create goals, log quarterly check-ins',
      badge: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Employee 2',
      email: 'employee2@demo.com',
      role: 'employee',
      desc: 'Second employee with shared goals',
      badge: 'bg-green-100 text-green-700',
    },
    {
      label: 'Manager',
      email: 'manager@demo.com',
      role: 'manager',
      desc: 'Approve goals, conduct check-ins',
      badge: 'bg-purple-100 text-purple-700',
    },
    {
      label: 'Admin',
      email: 'admin@demo.com',
      role: 'admin',
      desc: 'Manage cycles, reports, analytics',
      badge: 'bg-orange-100 text-orange-700',
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <button onClick={toggle}
          className="text-xs border border-gray-200 rounded-md px-3 py-1.5 text-gray-500 hover:bg-gray-100 bg-white transition-colors">
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-3">
          <div className="flex items-center gap-3 mb-8">
            <Image src="/logo.png" alt="Atomberg logo" width={40} height={40} className="rounded-lg" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AtomQuest</h1>
              <p className="text-xs text-gray-400">Goal Setting and Tracking Portal &middot; by Atomberg</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <p className="text-xs text-gray-400 mb-4">Sign in with your credentials or use a demo account below.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316]"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316]"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-[#F97316] text-white rounded-md py-2.5 text-sm font-medium hover:bg-[#EA6C00] disabled:opacity-50 transition-colors">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-400">or use a demo account</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Demo accounts — click to sign in instantly</p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map(u => (
              <button
                key={u.email}
                onClick={() => quickLogin(u.email, u.role)}
                disabled={loading}
                className="border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + u.badge}>
                    {u.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-mono mb-0.5">{u.email}</p>
                <p className="text-xs text-gray-400 font-mono">{u.role}@atomberg</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-center text-gray-400 mt-3">
            Click any card to sign in instantly &middot; or enter credentials manually above
          </p>
        </div>
      </div>
    </div>
  )
}
