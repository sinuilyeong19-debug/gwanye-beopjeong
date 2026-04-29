'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CaseCard } from './CaseCard'

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

interface Props {
  cases: RawCase[]
  caseCount: number
  totalVotes: number
  aiCount: number
}

// ── 타이핑 효과 ────────────────────────────────────
const TYPING_TEXTS = [
  '연애 분쟁을 심판합니다',
  '우정 갈등을 판결합니다',
  '가족 분쟁을 해결합니다',
  '억울함에 판결을 내립니다',
]

function useTypingEffect(speed = 75, pause = 2400) {
  const [textIdx, setTextIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = TYPING_TEXTS[textIdx]
    if (!deleting && charIdx < current.length) {
      const t = setTimeout(() => setCharIdx(i => i + 1), speed)
      return () => clearTimeout(t)
    }
    if (!deleting && charIdx === current.length) {
      const t = setTimeout(() => setDeleting(true), pause)
      return () => clearTimeout(t)
    }
    if (deleting && charIdx > 0) {
      const t = setTimeout(() => setCharIdx(i => i - 1), speed / 2)
      return () => clearTimeout(t)
    }
    if (deleting && charIdx === 0) {
      setDeleting(false)
      setTextIdx(i => (i + 1) % TYPING_TEXTS.length)
    }
  }, [charIdx, deleting, textIdx, speed, pause])

  return TYPING_TEXTS[textIdx].slice(0, charIdx)
}

// ── 카운터 애니메이션 ──────────────────────────────
function useCounter(target: number, duration = 1600) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const startTime = performance.now()
          const tick = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(target * eased))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref }
}

// ── 스크롤 페이드인 ────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
      },
      { threshold: 0.06, rootMargin: '0px 0px -24px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ── 통계 항목 ──────────────────────────────────────
function StatItem({ target, label }: { target: number; label: string }) {
  const { count, ref } = useCounter(target)
  return (
    <div ref={ref} className="text-center px-8 sm:px-14 py-2">
      <div className="text-3xl sm:text-4xl font-black tabular-nums stat-number">
        {count.toLocaleString()}
      </div>
      <div
        className="text-[11px] mt-2 tracking-[0.22em] uppercase"
        style={{ color: 'rgba(201,168,76,0.4)' }}
      >
        {label}
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ──────────────────────────────────
export function HomeClient({ cases, caseCount, totalVotes, aiCount }: Props) {
  const typingText = useTypingEffect()

  return (
    <div className="relative -mt-8">

      {/* ── 히어로 ───────────────────────────────── */}
      <section className="relative text-center pt-24 pb-20 sm:pt-32 sm:pb-28 overflow-hidden">

        {/* 배경 — 골드 빛 방사형 */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 100%)' }} />
        <div className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.18), transparent)' }} />

        {/* 법정 망치 */}
        <div className="animate-gavel animate-hero-in text-6xl sm:text-8xl mb-8 select-none">
          ⚖️
        </div>

        {/* 타이틀 */}
        <h1
          className="animate-hero-in text-5xl sm:text-7xl font-black tracking-tight mb-3"
          style={{
            fontFamily: "'Noto Serif KR', serif",
            background: 'linear-gradient(160deg, #FFFFFF 0%, #F0E4B8 40%, #E8D5A3 70%, #C9A84C 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          관계법정
        </h1>

        {/* 영문 서브 */}
        <p
          className="animate-fade-up-1 text-xs sm:text-[11px] tracking-[0.5em] uppercase mb-8"
          style={{ color: 'rgba(201,168,76,0.4)', fontWeight: 300, letterSpacing: '0.45em' }}
        >
          AI&nbsp;Judge&nbsp;&nbsp;·&nbsp;&nbsp;Jury&nbsp;Verdict&nbsp;System
        </p>

        {/* 타이핑 효과 */}
        <div className="animate-fade-up-2 h-9 mb-10 flex items-center justify-center">
          <p
            className="text-lg sm:text-xl font-medium"
            style={{ fontFamily: "'Noto Serif KR', serif", color: 'rgba(232,213,163,0.75)' }}
          >
            {typingText}
            <span className="animate-caret">|</span>
          </p>
        </div>

        {/* CTA 버튼 */}
        <div className="animate-fade-up-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/cases/new" className="btn-glass">
            ⚖️ 지금 사건 접수하기
          </Link>
          <Link href="/laws" className="btn-ghost">
            📜 법전 보기
          </Link>
        </div>

        {/* 장식선 */}
        <div className="animate-fade-up-4 mt-16 flex items-center justify-center gap-4">
          <div className="h-px w-14" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2))' }} />
          <span
            className="text-[9px] tracking-[0.45em] uppercase"
            style={{ color: 'rgba(201,168,76,0.25)', fontWeight: 300 }}
          >
            The Court Is In Session
          </span>
          <div className="h-px w-14" style={{ background: 'linear-gradient(270deg, transparent, rgba(201,168,76,0.2))' }} />
        </div>
      </section>

      {/* ── 통계 ─────────────────────────────────── */}
      <FadeIn>
        <section className="relative py-10 mb-14">
          <div className="absolute inset-0"
            style={{
              borderTop: '1px solid rgba(201,168,76,0.12)',
              borderBottom: '1px solid rgba(201,168,76,0.12)',
              background: 'linear-gradient(180deg, rgba(201,168,76,0.025) 0%, transparent 50%, rgba(201,168,76,0.025) 100%)',
            }} />
          <div className="relative flex items-stretch justify-center">
            <StatItem target={caseCount}  label="접수된 사건" />
            <div style={{ width: '1px', background: 'rgba(201,168,76,0.12)', margin: '4px 0' }} />
            <StatItem target={totalVotes} label="배심원 투표" />
            <div style={{ width: '1px', background: 'rgba(201,168,76,0.12)', margin: '4px 0' }} />
            <StatItem target={aiCount}    label="AI 판결 완료" />
          </div>
        </section>
      </FadeIn>

      {/* ── 이용 방법 ─────────────────────────────── */}
      <FadeIn delay={60}>
        <section className="mb-16">
          <div className="flex items-center justify-center gap-4 mb-9">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.15))' }} />
            <p
              className="text-[10px] tracking-[0.4em] uppercase"
              style={{ color: 'rgba(201,168,76,0.35)', fontWeight: 300 }}
            >
              How It Works
            </p>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(270deg, transparent, rgba(201,168,76,0.15))' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: '📝', step: '01', title: '사건 접수',
                desc: '억울한 사연을 상세히 제출하세요. 원고·피고 양측의 진술을 기록합니다.',
              },
              {
                icon: '🤖', step: '02', title: 'AI 판사 심판',
                desc: 'Claude AI가 관계법정 법전에 근거하여 공정하고 권위 있는 판결을 내립니다.',
              },
              {
                icon: '🗳️', step: '03', title: '배심원 투표',
                desc: '전체 유저가 배심원이 되어 원고·피고·무승부 중 하나를 선택합니다.',
              },
            ].map(({ icon, step, title, desc }) => (
              <div key={step} className="step-card group">
                <div
                  className="text-xs font-medium tracking-[0.35em] mb-4"
                  style={{ color: 'rgba(201,168,76,0.35)' }}
                >
                  STEP {step}
                </div>
                <div className="text-4xl mb-4 transition-transform duration-300 group-hover:scale-110">
                  {icon}
                </div>
                <div
                  className="font-bold text-[15px] mb-3"
                  style={{ fontFamily: "'Noto Serif KR', serif", color: '#E8D5A3' }}
                >
                  {title}
                </div>
                <div
                  className="text-xs leading-relaxed"
                  style={{ color: 'rgba(201,168,76,0.4)' }}
                >
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ── 사건 목록 ─────────────────────────────── */}
      <FadeIn delay={80}>
        <section>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2
                className="text-[17px] font-bold"
                style={{ fontFamily: "'Noto Serif KR', serif", color: '#E8D5A3' }}
              >
                진행 중인 사건
              </h2>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'rgba(201,168,76,0.38)' }}
              >
                총 {caseCount.toLocaleString()}건 · 최신순
              </p>
            </div>
            <Link
              href="/cases/new"
              className="text-xs px-4 py-2 rounded-lg transition-all duration-200"
              style={{
                color: 'rgba(201,168,76,0.5)',
                border: '1px solid rgba(201,168,76,0.18)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = '#E8D5A3'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.4)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.06)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(201,168,76,0.5)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.18)'
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              + 사건 접수
            </Link>
          </div>

          {cases.length > 0 ? (
            <div className="space-y-3">
              {cases.map(c => (
                <CaseCard key={c.id} c={c} />
              ))}
            </div>
          ) : (
            <div className="case-card-glow p-16 text-center">
              <div className="text-5xl mb-4" style={{ opacity: 0.2 }}>📋</div>
              <p className="text-sm" style={{ color: 'rgba(201,168,76,0.35)' }}>
                아직 접수된 사건이 없습니다
              </p>
              <Link
                href="/cases/new"
                className="inline-block mt-4 text-sm transition-colors"
                style={{ color: 'rgba(201,168,76,0.65)' }}
              >
                첫 사건을 접수해보세요 →
              </Link>
            </div>
          )}
        </section>
      </FadeIn>

    </div>
  )
}
