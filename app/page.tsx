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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', {
      email,
      password: 'demo',
      redirect: false,
    })
    if (result?.error) {
      setError('Email not found. Use one of the demo accounts below.')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  async function quickLogin(demoEmail: string) {
    setLoading(true)
    const result = await signIn('credentials', {
      email: demoEmail,
      password: 'demo',
      redirect: false,
    })
    if (!result?.error) router.push('/dashboard')
    setLoading(false)
  }

  const demoAccounts = [
    {
      label: 'Employee',
      email: 'employee@demo.com',
      desc: 'Create goals, log quarterly check-ins',
      color: 'border-blue-200 hover:bg-blue-50',
      badge: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Employee 2',
      email: 'employee2@demo.com',
      desc: 'Second employee with shared goals',
      color: 'border-green-200 hover:bg-green-50',
      badge: 'bg-green-100 text-green-700',
    },
    {
      label: 'Manager',
      email: 'manager@demo.com',
      desc: 'Approve goals, conduct check-ins',
      color: 'border-purple-200 hover:bg-purple-50',
      badge: 'bg-purple-100 text-purple-700',
    },
    {
      label: 'Admin',
      email: 'admin@demo.com',
      desc: 'Manage cycles, reports, analytics',
      color: 'border-orange-200 hover:bg-orange-50',
      badge: 'bg-orange-100 text-orange-700',
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="absolute top-4 right-4">
        <button onClick={toggle}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 bg-white">
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </div>

      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-4">
          <div className="flex items-center gap-3 mb-8">
            <Image src="/logo.png" alt="Atomberg logo" width={44} height={44} className="rounded-xl" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AtomQuest</h1>
              <p className="text-xs text-gray-400">Goal Setting and Tracking Portal &middot; by Atomberg</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Demo accounts — click to sign in instantly</p>
          <div className="grid grid-cols-2 gap-3">
            {demoAccounts.map(u => (
              <button
                key={u.email}
                onClick={() => quickLogin(u.email)}
                disabled={loading}
                className={'border rounded-xl p-3 text-left transition-colors disabled:opacity-50 ' + u.color}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + u.badge}>
                    {u.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{u.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}