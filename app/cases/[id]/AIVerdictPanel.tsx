'use client'

import { useState } from 'react'

interface Props {
  caseId: string
  initialVerdict: string | null
  initialWinner: string | null
  plaintiffName: string
  defendantName: string
}

export function AIVerdictPanel({ caseId, initialVerdict, initialWinner, plaintiffName, defendantName }: Props) {
  const [verdict, setVerdict] = useState<string | null>(initialVerdict)
  const [winner, setWinner] = useState<string | null>(initialWinner)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const winnerLabel: Record<string, string> = {
    plaintiff: `원고 ${plaintiffName} 승`,
    defendant: `피고 ${defendantName} 승`,
    neutral: '무승부',
  }

  const winnerColor: Record<string, string> = {
    plaintiff: 'text-red-300 border-red-700/50 bg-red-900/20',
    defendant: 'text-blue-300 border-blue-700/50 bg-blue-900/20',
    neutral: 'text-yellow-300 border-yellow-700/50 bg-yellow-900/20',
  }

  const requestVerdict = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai-verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      })
      if (!res.ok) {
        const { error: e } = await res.json()
        throw new Error(e || '판결 요청 실패')
      }
      const { verdict: v, winner: w } = await res.json()
      setVerdict(v)
      setWinner(w)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (!verdict) {
    return (
      <div className="court-card p-6 text-center">
        <div className="text-4xl mb-3">🤖</div>
        <div className="section-title mb-2">AI 판사 판결</div>
        <p className="text-yellow-700 text-sm mb-5">
          Claude AI가 양측 진술을 분석해 공정한 판결을 내립니다.
        </p>
        {error && (
          <p className="text-red-400 text-sm mb-3 bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
        )}
        <button
          onClick={requestVerdict}
          disabled={loading}
          className="btn-gold px-8 py-3"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              판사석 검토 중...
            </span>
          ) : '⚖️ AI 판결 요청하기'}
        </button>
      </div>
    )
  }

  return (
    <div className="court-card p-6">
      <div className="section-title mb-4 flex items-center gap-2">
        🤖 AI 판사 판결
      </div>

      {winner && (
        <div className={`border rounded-xl px-5 py-3 mb-5 text-center ${winnerColor[winner] ?? ''}`}>
          <div className="text-xs uppercase tracking-widest mb-1 opacity-60">판결 결과</div>
          <div className="text-xl font-black">⚖️ {winnerLabel[winner] ?? winner}</div>
        </div>
      )}

      <div className="prose prose-invert max-w-none">
        <div className="text-yellow-100/80 text-sm leading-relaxed whitespace-pre-wrap font-serif">
          {verdict}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-yellow-900/30 text-yellow-900 text-xs text-center">
        * AI 판결은 오락 목적이며 실제 법적 판단이 아닙니다
      </div>
    </div>
  )
}
