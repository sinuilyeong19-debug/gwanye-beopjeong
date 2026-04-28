'use client'

import { useEffect, useRef, useState } from 'react'

// ── Web Audio 합성: 법정 망치 + 차임벨 ────────────────
function playGavelSound() {
  try {
    const AudioCtx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    const t   = ctx.currentTime

    // 마스터 게인
    const master = ctx.createGain()
    master.gain.value = 0.72
    master.connect(ctx.destination)

    // ── ① 나무 충격음 (백색 소음 버스트) ─────────
    // 망치가 받침대를 때리는 순간의 "탁" 느낌
    const sr  = ctx.sampleRate
    const crackleBuf = ctx.createBuffer(1, Math.floor(sr * 0.09), sr)
    const ch  = crackleBuf.getChannelData(0)
    for (let i = 0; i < ch.length; i++) {
      // 지수 감쇠 노이즈: 앞부분 크고 빠르게 소멸
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.022))
    }
    const crackle     = ctx.createBufferSource()
    crackle.buffer    = crackleBuf
    const hpf         = ctx.createBiquadFilter()
    hpf.type          = 'highpass'
    hpf.frequency.value = 500
    const crackleGain = ctx.createGain()
    crackleGain.gain.value = 0.42
    crackle.connect(hpf)
    hpf.connect(crackleGain)
    crackleGain.connect(master)
    crackle.start(t)

    // ── ② 첫 번째 저음 "두~" ──────────────────────
    // 115Hz → 38Hz 로 내려가며 단단한 울림
    const o1 = ctx.createOscillator()
    const g1 = ctx.createGain()
    o1.type  = 'sine'
    o1.frequency.setValueAtTime(115, t)
    o1.frequency.exponentialRampToValueAtTime(38, t + 0.44)
    g1.gain.setValueAtTime(0.001, t)
    g1.gain.linearRampToValueAtTime(1.0, t + 0.006) // 즉각 어택
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.44)
    o1.connect(g1)
    g1.connect(master)
    o1.start(t)
    o1.stop(t + 0.5)

    // ── ③ 두 번째 저음 "둥~" (0.17초 뒤) ─────────
    // 살짝 낮고 여운 있게
    const o2 = ctx.createOscillator()
    const g2 = ctx.createGain()
    o2.type  = 'sine'
    o2.frequency.setValueAtTime(88, t + 0.17)
    o2.frequency.exponentialRampToValueAtTime(28, t + 0.60)
    g2.gain.setValueAtTime(0.001, t + 0.17)
    g2.gain.linearRampToValueAtTime(0.78, t + 0.176)
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.60)
    o2.connect(g2)
    g2.connect(master)
    o2.start(t + 0.17)
    o2.stop(t + 0.68)

    // ── ④ 법정 차임벨 고배음 3화음 ───────────────
    // 880Hz(A5) · 1320Hz(E6) · 2200Hz(C#7) — 사법적 위엄
    const bells: [number, number, number][] = [
      [880,  0.14, 0.05],
      [1320, 0.09, 0.09],
      [2200, 0.045, 0.14],
    ]
    bells.forEach(([freq, vol, delay]) => {
      const osc = ctx.createOscillator()
      const gn  = ctx.createGain()
      osc.type  = 'sine'
      osc.frequency.value = freq
      gn.gain.setValueAtTime(0.001, t + delay)
      gn.gain.linearRampToValueAtTime(vol, t + delay + 0.018)
      gn.gain.exponentialRampToValueAtTime(0.001, t + delay + 1.9)
      osc.connect(gn)
      gn.connect(master)
      osc.start(t + delay)
      osc.stop(t + delay + 2.0)
    })

    // 2.5초 후 컨텍스트 해제
    setTimeout(() => ctx.close(), 2500)
  } catch {
    // AudioContext 미지원 환경 — 무시
  }
}

// ── 스플래시 컴포넌트 ──────────────────────────────────
type Phase = 'idle' | 'visible' | 'fading' | 'done'

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>('idle')
  const soundPlayed = useRef(false)

  useEffect(() => {
    // 세션당 1회만 표시
    if (sessionStorage.getItem('splash_v2')) {
      setPhase('done')
      return
    }
    sessionStorage.setItem('splash_v2', '1')
    setPhase('visible')

    // 첫 번째 터치/클릭 시 소리 재생 (브라우저 오토플레이 정책 준수)
    const handleInteraction = () => {
      if (soundPlayed.current) return
      soundPlayed.current = true
      playGavelSound()
      document.removeEventListener('click',      handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
    }
    document.addEventListener('click',      handleInteraction)
    document.addEventListener('touchstart', handleInteraction)

    const t1 = setTimeout(() => setPhase('fading'), 2000)
    const t2 = setTimeout(() => setPhase('done'),   2750)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      document.removeEventListener('click',      handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
    }
  }, [])

  if (phase === 'idle' || phase === 'done') return null

  return (
    <div
      aria-hidden="true"
      style={{
        position:   'fixed',
        inset:       0,
        zIndex:      99998,
        background: '#0a0a0a',
        display:    'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity:    phase === 'fading' ? 0 : 1,
        transition: 'opacity 0.75s cubic-bezier(0.16,1,0.3,1)',
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
        userSelect: 'none',
      }}
    >
      {/* 배경 방사형 글로우 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 58% 48% at 50% 50%, rgba(232,213,163,0.055) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* ⚖️ 아이콘 — scale 0.4 → 1.0 스프링 + 글로우 */}
      <div style={{
        fontSize: '80px',
        marginBottom: '24px',
        position: 'relative',
        zIndex: 1,
        // 진입 애니메이션 0.55s → 이후 무한 글로우 펄스
        animation: [
          'splash-icon-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both',
          'splash-glow 2.2s ease-in-out 0.55s infinite',
        ].join(', '),
      }}>
        ⚖️
      </div>

      {/* 타이틀 */}
      <div style={{
        fontFamily: "'Noto Serif KR', Georgia, serif",
        fontSize: '32px',
        fontWeight: 900,
        color: '#ffffff',
        letterSpacing: '-0.01em',
        animation: 'splash-fadein 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s both',
        position: 'relative',
        zIndex: 1,
      }}>
        관계법정
      </div>

      {/* 영문 서브 */}
      <div style={{
        fontSize: '10px',
        fontWeight: 300,
        letterSpacing: '0.45em',
        color: 'rgba(255,255,255,0.22)',
        textTransform: 'uppercase',
        marginTop: '10px',
        animation: 'splash-fadein 0.5s cubic-bezier(0.16,1,0.3,1) 0.5s both',
        position: 'relative',
        zIndex: 1,
      }}>
        AI Judge&nbsp;·&nbsp;Jury System
      </div>

      {/* 터치 힌트 */}
      <div style={{
        fontSize: '10px',
        color: 'rgba(255,255,255,0.18)',
        marginTop: '44px',
        letterSpacing: '0.12em',
        animation: [
          'splash-fadein 0.5s ease 0.9s both',
          'splash-tap-hint 2s ease-in-out 1.4s infinite',
        ].join(', '),
        position: 'relative',
        zIndex: 1,
      }}>
        화면을 터치하면 소리가 재생됩니다
      </div>

      {/* 하단 진행 바 */}
      <div style={{
        position: 'absolute',
        bottom: '9%',
        width: '52px',
        height: '1px',
        background: 'rgba(232,213,163,0.12)',
        borderRadius: '1px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, rgba(232,213,163,0.35), rgba(232,213,163,0.75))',
          animation: 'splash-progress 1.9s cubic-bezier(0.4,0,0.2,1) 0.1s both',
        }} />
      </div>
    </div>
  )
}
