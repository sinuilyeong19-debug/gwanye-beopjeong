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
    <header
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{
        background: 'rgba(6,4,1,0.96)',
        borderBottom: '1px solid rgba(201,168,76,0.2)',
        boxShadow: '0 1px 0 rgba(201,168,76,0.06), 0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* 상단 골드 라인 */}
      <div
        className="h-px w-full"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), rgba(232,213,163,0.7), rgba(201,168,76,0.5), transparent)' }}
      />
      <div className="max-w-4xl mx-auto px-4 h-15 flex items-center justify-between" style={{ height: '60px' }}>

        {/* 로고 */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            style={{ filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.4))' }}>
            ⚖️
          </span>
          <div>
            <span
              className="font-black text-lg tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #C9A84C 0%, #F0E4B8 50%, #C9A84C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: "'Noto Serif KR', serif",
              }}
            >
              관계법정
            </span>
            <span className="hidden sm:block text-[10px] tracking-widest uppercase" style={{ color: 'rgba(201,168,76,0.45)' }}>
              AI Judge · Jury Verdict
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/laws" className="hidden sm:block text-sm px-3 py-1.5 rounded-lg transition-all duration-200"
            style={{ color: 'rgba(201,168,76,0.6)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#E8D5A3'; (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.07)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(201,168,76,0.6)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            📜 법전
          </Link>
          <Link href="/ranking" className="hidden sm:block text-sm px-3 py-1.5 rounded-lg transition-all duration-200"
            style={{ color: 'rgba(201,168,76,0.6)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#E8D5A3'; (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.07)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(201,168,76,0.6)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            🏆 랭킹
          </Link>
          <Link href="/community" className="hidden sm:block text-sm px-3 py-1.5 rounded-lg transition-all duration-200"
            style={{ color: 'rgba(201,168,76,0.6)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#E8D5A3'; (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.07)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(201,168,76,0.6)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            커뮤니티
          </Link>

          <Link href="/cases/new" className="btn-gold text-xs sm:text-sm px-4 py-2">
            + 사건 접수
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-200"
                style={{
                  border: '1px solid rgba(201,168,76,0.3)',
                  background: 'rgba(201,168,76,0.04)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.55)'; (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.04)' }}
              >
                {avatar ? (
                  <Image src={avatar} alt={displayName} width={24} height={24} className="rounded-full" style={{ border: '1px solid rgba(201,168,76,0.3)' }} />
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: 'linear-gradient(135deg, #B8902E, #E8D5A3)', color: '#1a0f00' }}>
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="text-sm max-w-24 truncate" style={{ color: '#E8D5A3' }}>{displayName}</span>
                  {levelInfo && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${levelInfo.badge}`}>
                      Lv.{profile!.level}
                    </span>
                  )}
                </div>
                <svg className="w-3 h-3" style={{ color: 'rgba(201,168,76,0.5)' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-44 py-1 rounded-xl shadow-2xl"
                  style={{
                    background: 'rgba(8,6,1,0.97)',
                    border: '1px solid rgba(201,168,76,0.25)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.06)',
                  }}
                >
                  {profile && (
                    <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(201,168,76,0.12)' }}>
                      <p className={`text-xs font-semibold ${levelInfo?.color}`}>{levelInfo?.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(201,168,76,0.45)' }}>{profile.exp.toLocaleString()} EXP</p>
                    </div>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm transition-colors"
                    style={{ color: 'rgba(232,213,163,0.75)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)'; (e.currentTarget as HTMLElement).style.color = '#E8D5A3' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(232,213,163,0.75)' }}
                  >
                    마이페이지
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                    style={{ color: 'rgba(232,213,163,0.75)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)'; (e.currentTarget as HTMLElement).style.color = '#E8D5A3' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(232,213,163,0.75)' }}
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
