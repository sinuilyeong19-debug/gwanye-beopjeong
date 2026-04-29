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

      {/* 뒤로가기 */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'rgba(201,168,76,0.5)' }}
        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { (e.currentTarget as HTMLElement).style.color = '#C9A84C' }}
        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { (e.currentTarget as HTMLElement).style.color = 'rgba(201,168,76,0.5)' }}
      >
        ← 목록으로
      </Link>

      {/* 사건 헤더 카드 */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'rgba(8,6,1,0.92)',
          border: '1px solid rgba(201,168,76,0.25)',
          boxShadow: '0 0 0 1px rgba(201,168,76,0.06), inset 0 1px 0 rgba(232,213,163,0.07), 0 12px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* 상단 골드 장식선 */}
        <div
          className="h-px w-full mb-5"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), rgba(232,213,163,0.6), rgba(201,168,76,0.4), transparent)' }}
        />

        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: 'rgba(201,168,76,0.4)' }}
          >
            {formattedDate} 접수
          </span>
          <span style={{ color: 'rgba(201,168,76,0.2)' }}>·</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.2)',
              color: 'rgba(201,168,76,0.7)',
            }}
          >
            {initialCounts.total}표
          </span>
        </div>

        <h1
          className="text-2xl font-black leading-tight mb-6"
          style={{
            fontFamily: "'Noto Serif KR', serif",
            color: '#F0E4B8',
          }}
        >
          {c.title}
        </h1>

        <div className="flex items-center gap-4 text-sm">
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 flex-1 justify-center"
            style={{
              background: 'rgba(220,60,60,0.08)',
              border: '1px solid rgba(220,60,60,0.25)',
            }}
          >
            <span className="text-xs" style={{ color: 'rgba(220,100,100,0.6)' }}>원고</span>
            <span className="font-bold" style={{ color: '#f09090' }}>{c.plaintiff_name}</span>
          </div>
          <div
            className="font-black text-xl select-none"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #E8D5A3)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            VS
          </div>
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 flex-1 justify-center"
            style={{
              background: 'rgba(60,100,220,0.08)',
              border: '1px solid rgba(60,100,220,0.25)',
            }}
          >
            <span className="text-xs" style={{ color: 'rgba(100,130,220,0.6)' }}>피고</span>
            <span className="font-bold" style={{ color: '#90a8f0' }}>{c.defendant_name}</span>
          </div>
        </div>

        <div
          className="h-px w-full mt-5"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.15), transparent)' }}
        />
      </div>

      {/* 원고 진술 */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(8,6,1,0.88)',
          border: '1px solid rgba(201,168,76,0.18)',
          boxShadow: 'inset 0 1px 0 rgba(232,213,163,0.05), 0 6px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-1 h-4 rounded-full"
            style={{ background: 'linear-gradient(180deg, #f08080, rgba(220,60,60,0.3))' }}
          />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f08080' }}>
            원고 진술
          </span>
          <span className="text-xs" style={{ color: 'rgba(201,168,76,0.35)' }}>— {c.plaintiff_name}</span>
        </div>
        <blockquote
          className="text-sm leading-relaxed whitespace-pre-wrap pl-4"
          style={{
            color: 'rgba(240,228,184,0.75)',
            borderLeft: '2px solid rgba(220,60,60,0.3)',
            fontFamily: "'Noto Serif KR', serif",
          }}
        >
          {c.plaintiff_statement}
        </blockquote>
      </div>

      {/* 피고 진술 */}
      {c.defendant_statement ? (
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(8,6,1,0.88)',
            border: '1px solid rgba(201,168,76,0.18)',
            boxShadow: 'inset 0 1px 0 rgba(232,213,163,0.05), 0 6px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-1 h-4 rounded-full"
              style={{ background: 'linear-gradient(180deg, #90a8f0, rgba(60,100,220,0.3))' }}
            />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#90a8f0' }}>
              피고 진술
            </span>
            <span className="text-xs" style={{ color: 'rgba(201,168,76,0.35)' }}>— {c.defendant_name}</span>
          </div>
          <blockquote
            className="text-sm leading-relaxed whitespace-pre-wrap pl-4"
            style={{
              color: 'rgba(240,228,184,0.75)',
              borderLeft: '2px solid rgba(60,100,220,0.3)',
              fontFamily: "'Noto Serif KR', serif",
            }}
          >
            {c.defendant_statement}
          </blockquote>
        </div>
      ) : (
        <div
          className="rounded-2xl p-5 text-center"
          style={{
            background: 'rgba(8,6,1,0.7)',
            border: '1px solid rgba(201,168,76,0.1)',
          }}
        >
          <div className="text-sm" style={{ color: 'rgba(201,168,76,0.4)' }}>
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
        <p className="text-sm mb-3" style={{ color: 'rgba(201,168,76,0.4)' }}>
          이 판결을 친구에게 공유하세요
        </p>
        <ShareButton />
      </div>
    </div>
  )
}
