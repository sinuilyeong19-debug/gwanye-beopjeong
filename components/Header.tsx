'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getLevelInfo } from '@/lib/level'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const loadProfile = async (uid: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
      setProfile(data as Profile | null)
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) loadProfile(data.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) loadProfile(u.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setMenuOpen(false)
    setProfile(null)
  }

  const avatar = user?.user_metadata?.avatar_url
  const displayName = profile?.nickname || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '배심원'
  const levelInfo = profile ? getLevelInfo(profile.exp) : null

  return (
    <header className="sticky top-0 z-50 border-b border-yellow-900/30 bg-[#0c0802]/95 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">⚖️</span>
          <div>
            <span className="font-bold text-yellow-400 text-lg tracking-tight">관계법정</span>
            <span className="hidden sm:block text-yellow-800 text-xs">AI 판사 · 배심원 투표</span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <Link href="/ranking" className="hidden sm:block text-yellow-600 hover:text-yellow-400 text-sm transition-colors">
            🏆 랭킹
          </Link>
          <Link href="/community" className="hidden sm:block text-yellow-600 hover:text-yellow-400 text-sm transition-colors">
            커뮤니티
          </Link>
          <Link href="/cases/new" className="btn-gold text-xs sm:text-sm">
            + 사건 접수
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full border border-yellow-800/50 hover:border-yellow-600 px-3 py-1.5 transition-colors"
              >
                {avatar ? (
                  <Image src={avatar} alt={displayName} width={24} height={24} className="rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-yellow-700 flex items-center justify-center text-xs font-bold text-yellow-200">
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-yellow-400 text-sm max-w-24 truncate">{displayName}</span>
                  {levelInfo && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${levelInfo.badge}`}>
                      Lv.{profile!.level}
                    </span>
                  )}
                </div>
                <svg className="w-3 h-3 text-yellow-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 court-card shadow-xl shadow-black/50 py-1">
                  {profile && (
                    <div className="px-4 py-2 border-b border-yellow-900/30">
                      <p className={`text-xs font-semibold ${levelInfo?.color}`}>{levelInfo?.title}</p>
                      <p className="text-yellow-700 text-xs">{profile.exp} EXP</p>
                    </div>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-yellow-400 hover:bg-yellow-900/20 text-sm transition-colors"
                  >
                    마이페이지
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-yellow-400 hover:bg-yellow-900/20 text-sm transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleLogin} className="btn-outline text-xs sm:text-sm flex items-center gap-2">
              <GoogleIcon />
              <span className="hidden sm:inline">구글 로그인</span>
              <span className="sm:hidden">로그인</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
      <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
      <path fill="#4A90D9" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
      <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
    </svg>
  )
}
