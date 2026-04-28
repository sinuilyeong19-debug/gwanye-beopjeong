import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminClient } from './AdminClient'

const ADMIN_EMAIL = 'sinuilyeong19@gmail.com'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  return <AdminClient />
}
