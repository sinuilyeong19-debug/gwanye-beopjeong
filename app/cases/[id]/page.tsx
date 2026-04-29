import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { VotePanel } from './VotePanel'
import { AIVerdictPanel } from './AIVerdictPanel'
import { ShareButton } from './ShareButton'
import type { VoteCounts } from '@/lib/types'

export const revalidate = 0

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: c } = await supabase
    .from('cases')
    .select('*, votes(vote)')
    .eq('id', id)
    .single()

  if (!c) notFound()

  const votes: Array<{ vote: string }> = c.votes ?? []
  const p = votes.filter(v => v.vote === 'plaintiff').length
  const d = votes.filter(v => v.vote === 'defendant').length
  const n = votes.filter(v => v.vote === 'neutral').length

  const initialCounts: VoteCounts = { plaintiff: p, defendant: d, neutral: n, total: p + d + n }

  const formattedDate = new Date(c.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* 뒤로가기 */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'rgba(255,255,255,0.3)' }}
        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { (e.currentTarget as HTMLElement).style.color = '#fff' }}
        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)' }}
      >
        ← 목록으로
      </Link>

      {/* 사건 헤더 카드 */}
      <div className="court-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{formattedDate} 접수</span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}
          >
            {initialCounts.total}표
          </span>
        </div>

        <h1
          className="text-2xl font-black leading-tight text-white mb-6"
          style={{ fontFamily: "'Noto Serif KR', serif" }}
        >
          {c.title}
        </h1>

        <div className="flex items-center gap-3 text-sm">
          <div
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 flex-1 justify-center"
            style={{ background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.18)' }}
          >
            <span className="text-xs" style={{ color: 'rgba(255,100,100,0.5)' }}>원고</span>
            <span className="font-bold" style={{ color: 'rgba(255,150,150,0.9)' }}>{c.plaintiff_name}</span>
          </div>
          <span className="font-black text-xl text-white select-none">VS</span>
          <div
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 flex-1 justify-center"
            style={{ background: 'rgba(80,120,255,0.06)', border: '1px solid rgba(80,120,255,0.18)' }}
          >
            <span className="text-xs" style={{ color: 'rgba(100,140,255,0.5)' }}>피고</span>
            <span className="font-bold" style={{ color: 'rgba(160,185,255,0.9)' }}>{c.defendant_name}</span>
          </div>
        </div>
      </div>

      {/* 원고 진술 */}
      <div className="court-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-0.5 h-4 rounded-full" style={{ background: 'rgba(255,100,100,0.6)' }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,120,120,0.8)' }}>원고 진술</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>— {c.plaintiff_name}</span>
        </div>
        <blockquote
          className="text-sm leading-relaxed whitespace-pre-wrap pl-4"
          style={{
            color: 'rgba(255,255,255,0.7)',
            borderLeft: '1px solid rgba(255,80,80,0.25)',
            fontFamily: "'Noto Serif KR', serif",
          }}
        >
          {c.plaintiff_statement}
        </blockquote>
      </div>

      {/* 피고 진술 */}
      {c.defendant_statement ? (
        <div className="court-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-0.5 h-4 rounded-full" style={{ background: 'rgba(100,140,255,0.6)' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(130,160,255,0.8)' }}>피고 진술</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>— {c.defendant_name}</span>
          </div>
          <blockquote
            className="text-sm leading-relaxed whitespace-pre-wrap pl-4"
            style={{
              color: 'rgba(255,255,255,0.7)',
              borderLeft: '1px solid rgba(80,120,255,0.25)',
              fontFamily: "'Noto Serif KR', serif",
            }}
          >
            {c.defendant_statement}
          </blockquote>
        </div>
      ) : (
        <div className="court-card p-5 text-center">
          <div className="text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
            📋 피고 측 진술이 없습니다. AI 판사는 원고 진술만으로 판단합니다.
          </div>
        </div>
      )}

      {/* AI 판결 */}
      <AIVerdictPanel
        caseId={c.id}
        initialVerdict={c.ai_verdict}
        initialWinner={c.ai_verdict_winner}
        plaintiffName={c.plaintiff_name}
        defendantName={c.defendant_name}
      />

      {/* 투표 패널 */}
      <VotePanel
        caseId={c.id}
        plaintiffName={c.plaintiff_name}
        defendantName={c.defendant_name}
        initialCounts={initialCounts}
      />

      {/* 공유 */}
      <div className="text-center py-3">
        <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>이 판결을 친구에게 공유하세요</p>
        <ShareButton />
      </div>
    </div>
  )
}
