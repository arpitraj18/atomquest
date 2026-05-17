import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const { data: logs, error } = await supabaseAdmin
    .from('audit_logs')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = [...new Set((logs || []).map((l: any) => l.changed_by).filter(Boolean))]

  let usersMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .in('id', userIds)
    for (const u of users || []) {
      usersMap[u.id] = u.name
    }
  }

  const enriched = (logs || []).map((log: any) => ({
    ...log,
    changer: log.changed_by ? { name: usersMap[log.changed_by] || 'Unknown' } : null,
  }))

  return NextResponse.json(enriched)
}