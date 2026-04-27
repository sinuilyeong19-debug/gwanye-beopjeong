'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { VoteType, VoteCounts } from '@/lib/types'

interface Props {
  caseId: string
  plaintiffName: string
  defendantName: string
  initialCounts: VoteCounts
}

export function VotePanel({ caseId, plaintiffName, defendantName, initialCounts }: Props) {
  const [counts, setCounts] = useState<VoteCounts>(initialCounts)
  const [userVote, setUserVote] = useState<VoteType | null>(null)
  const [loading, setLoading] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loginPrompt, setLoginPrompt] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null
      setUserId(uid)
      setLoggedIn(!!uid)
      if (uid) {
        const { data: v } = await supabase
          .from('votes')
          .select('vote')
          .eq('case_id', caseId)
          .eq('user_id', uid)
          .maybeSingle()
        if (v) setUserVote(v.vote as VoteType)
      }
    })

    const channel = supabase
      .channel(`votes:${caseId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `case_id=eq.${caseId}` }, () => {
        refreshCounts()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [caseId])

  const refreshCounts = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('votes').select('vote').eq('case_id', caseId)
    if (data) {
      const p = data.filter(v => v.vote === 'plaintiff').length
      const d = data.filter(v => v.vote === 'defendant').length
      const n = data.filter(v => v.vote === 'neutral').length
      setCounts({ plaintiff: p, defendant: d, neutral: n, total: p + d + n })
    }
  }

  const handleVote = async (vote: VoteType) => {
    if (!loggedIn) { setLoginPrompt(true); return }
    if (loading) return
    setLoading(true)

    const supabase = createClient()
    const isNewVote = userVote === null

    if (userVote === vote) {
      await supabase.from('votes').delete().eq('case_id', caseId).eq('user_id', userId!)
      setUserVote(null)
    } else {
      await supabase.from('votes').upsert(
        { case_id: caseId, user_id: userId!, vote },
        { onConflict: 'case_id,user_id' }
      )
      setUserVote(vote)

      if (isNewVote) {
        await supabase.rpc('add_vote_exp', { p_user_id: userId! })
      }
    }

    await refreshCounts()
    setLoading(false)
  }

  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/cases/${caseId}` },
    })
  }

  const { total } = counts
  const pPct = total > 0 ? Math.round((counts.plaintiff / total) * 100) : 0
  const dPct = total > 0 ? Math.round((counts.defendant / total) * 100) : 0
  const nPct = total > 0 ? Math.round((counts.neutral / total) * 100) : 0

  const voteBtn = (type: VoteType, label: string, color: string, selectedColor: string) => (
    <button
      onClick={() => handleVote(type)}
      disabled={loading}
      className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 border-2 ${
        userVote === type
          ? selectedColor
          : `border-transparent ${color} hover:border-current`
      } disabled:opacity-50`}
    >
      {label}
      <span className="block text-xs font-normal mt-0.5 opacity-70">
        {type === 'plaintiff' ? counts.plaintiff : type === 'defendant' ? counts.defendant : counts.neutral}표
      </span>
    </button>
  )

  return (
    <div className="court-card p-5">
      <div className="section-title mb-4 flex items-center gap-2">
        🗳️ 배심원 투표
        <span className="text-yellow-800 font-normal normal-case text-xs tracking-normal">— 총 {total}명 참여</span>
      </div>

      {loginPrompt && (
        <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-lg p-4 mb-4 text-center">
          <p className="text-yellow-300 text-sm mb-3">투표하려면 로그인이 필요합니다</p>
          <button onClick={handleLogin} className="btn-gold text-xs px-6 py-2">구글로 로그인</button>
        </div>
      )}

      <div className="flex gap-2 mb-5">
        {voteBtn('plaintiff', `✋ ${plaintiffName} 잘못`, 'text-red-400', 'bg-red-900/30 border-red-500 text-red-300')}
        {voteBtn('neutral', '🤝 둘 다 잘못', 'text-yellow-500', 'bg-yellow-900/30 border-yellow-500 text-yellow-300')}
        {voteBtn('defendant', `✋ ${defendantName} 잘못`, 'text-blue-400', 'bg-blue-900/30 border-blue-500 text-blue-300')}
      </div>

      {total > 0 && (
        <div className="space-y-2">
          {[
            { label: plaintiffName, pct: pPct, count: counts.plaintiff, color: 'bg-red-500' },
            { label: '무승부', pct: nPct, count: counts.neutral, color: 'bg-yellow-600' },
            { label: defendantName, pct: dPct, count: counts.defendant, color: 'bg-blue-500' },
          ].map(({ label, pct, count, color }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <span className="text-yellow-600 w-20 truncate text-xs">{label}</span>
              <div className="flex-1 h-2 bg-[#0c0802] rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-yellow-500 font-bold w-10 text-right text-xs">{pct}%</span>
              <span className="text-yellow-800 w-8 text-right text-xs">{count}</span>
            </div>
          ))}
        </div>
      )}

      {userVote && (
        <p className="text-center text-yellow-700 text-xs mt-3">
          내 투표: <span className="text-yellow-500">
            {userVote === 'plaintiff' ? plaintiffName : userVote === 'defendant' ? defendantName : '무승부'} 잘못
          </span> — 다시 클릭하면 취소
        </p>
      )}
    </div>
  )
}
