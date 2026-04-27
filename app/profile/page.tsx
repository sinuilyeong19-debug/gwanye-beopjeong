'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getLevelInfo, getExpProgress, LEVELS } from '@/lib/level'
import type { Profile } from '@/lib/types'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!data) { router.replace('/onboarding'); return }
      setProfile(data as Profile)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-yellow-700">로딩 중...</p>
      </div>
    )
  }

  if (!profile) return null

  const info = getLevelInfo(profile.exp)
  const { current, needed, pct } = getExpProgress(profile.exp)
  const isMaxLevel = info.maxExp === null

  return (
    <div className="max-w-lg mx-auto py-10 space-y-6">
      <div className="mb-2">
        <Link href="/" className="text-yellow-700 hover:text-yellow-500 text-sm flex items-center gap-1">
          ← 목록으로
        </Link>
      </div>

      {/* 프로필 카드 */}
      <div className="court-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-yellow-900/40 border border-yellow-700/50 flex items-center justify-center text-2xl font-black text-yellow-400">
            {profile.nickname[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-yellow-100">{profile.nickname}</h1>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${info.badge}`}>
                Lv.{profile.level}
              </span>
            </div>
            <p className={`text-sm font-semibold ${info.color}`}>{info.title}</p>
          </div>
        </div>

        {/* 경험치 바 */}
        <div className="mb-1 flex justify-between items-center text-xs text-yellow-700">
          <span>경험치</span>
          {isMaxLevel
            ? <span className="text-yellow-500 font-bold">MAX</span>
            : <span>{current} / {needed} EXP</span>
          }
        </div>
        <div className="h-3 bg-[#0c0802] rounded-full overflow-hidden border border-yellow-900/30 mb-1">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isMaxLevel ? 'bg-gradient-to-r from-yellow-600 to-red-500' : 'bg-yellow-600'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {!isMaxLevel && (
          <p className="text-right text-xs text-yellow-800">
            다음 레벨까지 {needed - current} EXP
          </p>
        )}
      </div>

      {/* 통계 */}
      <div className="court-card p-5">
        <h2 className="section-title mb-4">활동 통계</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-black text-yellow-400">{profile.total_votes}</p>
            <p className="text-xs text-yellow-700 mt-1">총 투표</p>
          </div>
          <div>
            <p className="text-2xl font-black text-yellow-400">{profile.exp}</p>
            <p className="text-xs text-yellow-700 mt-1">총 경험치</p>
          </div>
          <div>
            <p className="text-2xl font-black text-yellow-400">Lv.{profile.level}</p>
            <p className="text-xs text-yellow-700 mt-1">현재 레벨</p>
          </div>
        </div>
      </div>

      {/* 레벨 로드맵 */}
      <div className="court-card p-5">
        <h2 className="section-title mb-4">레벨 로드맵</h2>
        <div className="space-y-2">
          {LEVELS.map(l => {
            const isCurrent = l.level === profile.level
            const isDone = l.level < profile.level
            return (
              <div
                key={l.level}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                  isCurrent ? 'bg-yellow-900/20 border border-yellow-800/40' : ''
                }`}
              >
                <span className={`text-xs font-bold w-8 ${isDone || isCurrent ? l.color : 'text-yellow-900'}`}>
                  Lv.{l.level}
                </span>
                <span className={`flex-1 text-sm ${isDone || isCurrent ? 'text-yellow-200' : 'text-yellow-800'}`}>
                  {l.title}
                </span>
                <span className="text-xs text-yellow-800">
                  {l.maxExp === null ? `${l.minExp.toLocaleString()}+` : `${l.minExp}~${l.maxExp}`} EXP
                </span>
                {isDone && <span className="text-green-500 text-xs">✓</span>}
                {isCurrent && <span className="text-yellow-500 text-xs">◀ 현재</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
