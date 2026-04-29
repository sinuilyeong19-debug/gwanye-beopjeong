import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'sinuilyeong19@gmail.com'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const service = createServiceClient()
  const { data, error } = await service.auth.admin.listUsers({ perPage: 1000 })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const emails: Record<string, string> = {}
  for (const u of data.users) {
    if (u.email) emails[u.id] = u.email
  }

  return NextResponse.json(emails)
}
