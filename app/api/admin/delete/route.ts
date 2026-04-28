import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'sinuilyeong19@gmail.com'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { type, id } = await req.json()
  if (!type || !id) {
    return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })
  }

  const service = await createServiceClient()

  if (type === 'case') {
    const { error } = await service.from('cases').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (type === 'post') {
    const { error } = await service.from('posts').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
