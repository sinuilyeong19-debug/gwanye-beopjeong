'use client'

import { useEffect, useState } from 'react'

type Phase = 'idle' | 'visible' | 'fading' | 'done'

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>('idle')

  useEffect(() => {
    if (sessionStorage.getItem('splash_v1')) {
      setPhase('done')
      return
    }
    sessionStorage.setItem('splash_v1', '1')
    setPhase('visible')

    const t1 = setTimeout(() => setPhase('fading'), 1500)
    const t2 = setTimeout(() => setPhase('done'), 2150)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (phase === 'idle' || phase === 'done') return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 0.65s cubic-bezier(0.16,1,0.3,1)',
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
        userSelect: 'none',
      }}
    >
      {/* 배경 방사형 글로우 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(232,213,163,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* 아이콘 */}
      <div style={{
        fontSize: '72px',
        marginBottom: '20px',
        animation: 'splash-glow 1.8s ease-in-out infinite',
        position: 'relative',
        zIndex: 1,
      }}>
        ⚖️
      </div>

      {/* 타이틀 */}
      <div style={{
        fontFamily: "'Noto Serif KR', Georgia, serif",
        fontSize: '30px',
        fontWeight: 900,
        color: '#ffffff',
        letterSpacing: '-0.01em',
        position: 'relative',
        zIndex: 1,
        animation: 'splash-fadein 0.6s ease both',
      }}>
        관계법정
      </div>

      {/* 서브 텍스트 */}
      <div style={{
        fontSize: '10px',
        fontWeight: 300,
        letterSpacing: '0.45em',
        color: 'rgba(255,255,255,0.22)',
        textTransform: 'uppercase',
        marginTop: '12px',
        position: 'relative',
        zIndex: 1,
        animation: 'splash-fadein 0.6s ease 0.2s both',
      }}>
        AI Judge · Jury System
      </div>

      {/* 하단 로딩 바 */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        width: '48px',
        height: '1px',
        background: 'rgba(232,213,163,0.15)',
        borderRadius: '1px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'rgba(232,213,163,0.6)',
          animation: 'splash-progress 1.4s cubic-bezier(0.4,0,0.2,1) 0.1s both',
        }} />
      </div>
    </div>
  )
}
