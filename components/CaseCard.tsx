import Link from 'next/link'

interface RawCase {
  id: string
  title: string
  plaintiff_name: string
  defendant_name: string
  plaintiff_statement: string
  ai_verdict: string | null
  ai_verdict_winner: string | null
  status: string
  created_at: string
  votes?: Array<{ vote: string }>
}

export function CaseCard({ c }: { c: RawCase }) {
  const votes = c.votes ?? []
  const p = votes.filter(v => v.vote === 'plaintiff').length
  const d = votes.filter(v => v.vote === 'defendant').length
  const n = votes.filter(v => v.vote === 'neutral').length
  const total = votes.length

  const pPct = total > 0 ? Math.round((p / total) * 100) : 0
  const dPct = total > 0 ? Math.round((d / total) * 100) : 0

  const verdictColor: Record<string, string> = {
    plaintiff: 'text-red-400',
    defendant: 'text-blue-400',
    neutral: 'text-yellow-500',
  }

  const ago = (() => {
    const diff = Date.now() - new Date(c.created_at).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return '방금 전'
    if (h < 24) return `${h}시간 전`
    return `${Math.floor(h / 24)}일 전`
  })()

  return (
    <Link href={`/cases/${c.id}`} className="block">
      <article className="case-card-glow p-5 group cursor-pointer">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-yellow-100/90 group-hover:text-yellow-300 transition-colors duration-300 leading-snug line-clamp-2" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              {c.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-sm">
              <span className="text-red-400 font-medium">{c.plaintiff_name}</span>
              <span className="text-yellow-800 text-xs">⚔️</span>
              <span className="text-blue-400 font-medium">{c.defendant_name}</span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1">
            {c.ai_verdict ? (
              <span className={`text-xs font-bold px-2 py-0.5 rounded bg-yellow-900/30 ${verdictColor[c.ai_verdict_winner ?? 'neutral'] ?? 'text-yellow-500'}`}>
                ⚖️ 판결 완료
              </span>
            ) : (
              <span className="text-xs text-yellow-800 px-2 py-0.5 rounded border border-yellow-900/30">
                심리 중
              </span>
            )}
            <span className="text-yellow-900 text-xs">{ago}</span>
          </div>
        </div>

        <p className="text-yellow-200/50 text-sm line-clamp-2 mb-4 leading-relaxed">
          {c.plaintiff_statement}
        </p>

        {/* Vote bar */}
        <div className="space-y-2">
          <div className="h-2.5 bg-[#0c0802] rounded-full overflow-hidden flex gap-0.5">
            {total > 0 ? (
              <>
                <div className="bg-red-500/80 h-full rounded-l transition-all" style={{ width: `${pPct}%` }} />
                <div className="bg-yellow-700/60 h-full" style={{ width: `${n > 0 ? Math.round((n / total) * 100) : 0}%` }} />
                <div className="bg-blue-500/80 h-full rounded-r flex-1 transition-all" />
              </>
            ) : (
              <div className="h-full w-full bg-yellow-900/20 rounded animate-pulse-gold" />
            )}
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-red-400/70">원고 {pPct}%</span>
            <span className="text-yellow-800">{total}명 투표</span>
            <span className="text-blue-400/70">{dPct}% 피고</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
