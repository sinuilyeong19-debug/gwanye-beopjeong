import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CaseCard } from '@/components/CaseCard'

export const revalidate = 30

export default async function HomePage() {
  const supabase = await createClient()

  const { data: cases } = await supabase
    .from('cases')
    .select('*, votes(vote)')
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-16 mb-12 relative">
        <div className="absolute inset-0 bg-gradient-radial from-yellow-900/10 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="text-7xl mb-5 drop-shadow-lg">⚖️</div>
          <h1 className="text-4xl sm:text-5xl font-black text-yellow-400 mb-4 tracking-tight">
            관계법정
          </h1>
          <p className="text-yellow-200/60 text-base sm:text-lg max-w-lg mx-auto leading-relaxed mb-8">
            연애, 우정, 가족의 억울한 사연을 접수하면<br />
            <span className="text-yellow-400 font-semibold">AI 판사</span>가 심판하고{' '}
            <span className="text-yellow-400 font-semibold">배심원단</span>이 투표합니다
          </p>
          <Link href="/cases/new" className="btn-gold text-base px-8 py-3">
            ⚖️ 지금 사건 접수하기
          </Link>

          <div className="flex items-center justify-center gap-8 mt-10 text-sm text-yellow-800">
            <div className="text-center">
              <div className="text-2xl font-black text-yellow-500">{cases?.length ?? 0}</div>
              <div>접수된 사건</div>
            </div>
            <div className="w-px h-8 bg-yellow-900/40" />
            <div className="text-center">
              <div className="text-2xl font-black text-yellow-500">
                {cases?.reduce((acc, c) => acc + (c.votes?.length ?? 0), 0) ?? 0}
              </div>
              <div>총 배심원 투표</div>
            </div>
            <div className="w-px h-8 bg-yellow-900/40" />
            <div className="text-center">
              <div className="text-2xl font-black text-yellow-500">
                {cases?.filter(c => c.ai_verdict).length ?? 0}
              </div>
              <div>AI 판결 완료</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="grid grid-cols-3 gap-4 mb-12">
        {[
          { icon: '📝', step: '01', title: '사건 접수', desc: '억울한 사연을 제출하세요' },
          { icon: '🤖', step: '02', title: 'AI 판사', desc: 'Claude가 공정하게 심판합니다' },
          { icon: '🗳️', step: '03', title: '배심원 투표', desc: '모든 유저가 배심원이 됩니다' },
        ].map(({ icon, step, title, desc }) => (
          <div key={step} className="court-card p-4 text-center">
            <div className="text-3xl mb-2">{icon}</div>
            <div className="text-yellow-800 text-xs font-bold mb-1">STEP {step}</div>
            <div className="text-yellow-300 font-bold text-sm mb-1">{title}</div>
            <div className="text-yellow-700 text-xs">{desc}</div>
          </div>
        ))}
      </section>

      {/* Case list */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-yellow-400">
            진행 중인 사건
            <span className="ml-2 text-yellow-800 text-sm font-normal">({cases?.length ?? 0}건)</span>
          </h2>
        </div>

        {cases && cases.length > 0 ? (
          <div className="space-y-3">
            {cases.map(c => (
              <CaseCard key={c.id} c={c} />
            ))}
          </div>
        ) : (
          <div className="court-card p-16 text-center text-yellow-800">
            <div className="text-4xl mb-3">📋</div>
            <p>아직 접수된 사건이 없습니다.</p>
            <p className="text-sm mt-1">첫 사건을 접수해보세요!</p>
          </div>
        )}
      </section>
    </div>
  )
}
