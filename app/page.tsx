import { createClient } from '@/lib/supabase/server'
import { HomeClient } from '@/components/HomeClient'

export const revalidate = 30

export default async function HomePage() {
  const supabase = await createClient()

  const { data: cases } = await supabase
    .from('cases')
    .select('*, votes(vote)')
    .order('created_at', { ascending: false })
    .limit(30)

  const casesData = cases ?? []

  return (
    <HomeClient
      cases={casesData}
      caseCount={casesData.length}
      totalVotes={casesData.reduce((acc, c) => acc + (c.votes?.length ?? 0), 0)}
      aiCount={casesData.filter(c => c.ai_verdict).length}
    />
  )
}
