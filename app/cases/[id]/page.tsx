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
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <Link href="/" className="text-yellow-700 hover:text-yellow-500 text-sm flex items-center gap-1">
        ← 목록으로
      </Link>

      {/* Header */}
      <div className="court-card p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-yellow-800 text-xs pt-1">{formattedDate} 접수</span>
        </div>
        <h1 className="text-2xl font-black text-yellow-200 leading-tight mb-5">
          {c.title}
        </h1>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 bg-red-900/20 border border-red-900/40 rounded-lg px-4 py-2">
            <span className="text-red-700 text-xs">원고</span>
            <span className="text-red-300 font-bold">{c.plaintiff_name}</span>
          </div>
          <span className="text-yellow-800 font-black text-xl">VS</span>
          <div className="flex items-center gap-2 bg-blue-900/20 border border-blue-900/40 rounded-lg px-4 py-2">
            <span className="text-blue-700 text-xs">피고</span>
            <span className="text-blue-300 font-bold">{c.defendant_name}</span>
          </div>
        </div>
      </div>

      {/* Plaintiff statement */}
      <div className="court-card p-5">
        <div className="section-title mb-3">
          <span className="text-red-400">📣 원고 진술</span>
          <span className="text-yellow-800 ml-2 normal-case font-normal text-xs tracking-normal">— {c.plaintiff_name}</span>
        </div>
        <blockquote className="text-yellow-100/80 text-sm leading-relaxed whitespace-pre-wrap border-l-2 border-red-700/40 pl-4 font-serif">
          {c.plaintiff_statement}
        </blockquote>
      </div>

      {/* Defendant statement */}
      {c.defendant_statement ? (
        <div className="court-card p-5">
          <div className="section-title mb-3">
            <span className="text-blue-400">📣 피고 진술</span>
            <span className="text-yellow-800 ml-2 normal-case font-normal text-xs tracking-normal">— {c.defendant_name}</span>
          </div>
          <blockquote className="text-yellow-100/80 text-sm leading-relaxed whitespace-pre-wrap border-l-2 border-blue-700/40 pl-4 font-serif">
            {c.defendant_statement}
          </blockquote>
        </div>
      ) : (
        <div className="court-card p-5 text-center">
          <div className="text-yellow-800 text-sm">
            📋 피고 측 진술이 없습니다. AI 판사는 원고 진술만으로 판단합니다.
          </div>
        </div>
      )}

      {/* AI Verdict */}
      <AIVerdictPanel
        caseId={c.id}
        initialVerdict={c.ai_verdict}
        initialWinner={c.ai_verdict_winner}
        plaintiffName={c.plaintiff_name}
        defendantName={c.defendant_name}
      />

      {/* Vote Panel */}
      <VotePanel
        caseId={c.id}
        plaintiffName={c.plaintiff_name}
        defendantName={c.defendant_name}
        initialCounts={initialCounts}
      />

      {/* Share */}
      <div className="text-center py-2">
        <p className="text-yellow-800 text-sm mb-2">이 판결을 친구에게 공유하세요</p>
        <ShareButton />
      </div>
    </div>
  )
}
