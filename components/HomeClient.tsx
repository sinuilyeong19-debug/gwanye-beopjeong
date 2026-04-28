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

function useTypingEffect(speed = 75, pause = 2200) {
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
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
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
        transform: visible ? 'translateY(0)' : 'translateY(22px)',
        transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
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
    <div ref={ref} className="text-center px-6 sm:px-12 py-2">
      <div className="text-3xl sm:text-4xl font-black tabular-nums stat-number">
        {count.toLocaleString()}
      </div>
      <div className="text-yellow-800 text-[11px] mt-2 tracking-[0.2em] uppercase">{label}</div>
    </div>
  )
}

// ── 메인 컴포넌트 ──────────────────────────────────
export function HomeClient({ cases, caseCount, totalVotes, aiCount }: Props) {
  const typingText = useTypingEffect()

  return (
    <div className="relative -mt-8">

      {/* ── 히어로 섹션 ──────────────────────────── */}
      <section className="relative text-center pt-24 pb-20 sm:pt-32 sm:pb-28 overflow-hidden">
        {/* 배경 레이어 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(201,168,76,0.07),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_35%_at_50%_110%,rgba(100,40,5,0.08),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-900/30 to-transparent" />

        {/* 법정 망치 */}
        <div className="animate-gavel text-6xl sm:text-8xl mb-8 animate-hero-in select-none">
          ⚖️
        </div>

        {/* 타이틀 */}
        <h1
          className="animate-hero-in text-5xl sm:text-7xl font-black tracking-tight mb-3"
          style={{ fontFamily: "'Noto Serif KR', serif" }}
        >
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(180deg, #fde68a 0%, #c9a84c 50%, #a07830 100%)' }}
          >
            관계법정
          </span>
        </h1>

        {/* 영문 서브 */}
        <p className="animate-fade-up-1 text-yellow-800/70 text-xs sm:text-sm tracking-[0.35em] uppercase mb-7 font-light">
          AI Judge · Jury Verdict System
        </p>

        {/* 타이핑 효과 */}
        <div className="animate-fade-up-2 h-9 mb-10 flex items-center justify-center">
          <p className="text-yellow-100/80 text-lg sm:text-xl font-medium" style={{ fontFamily: "'Noto Serif KR', serif" }}>
            {typingText}
            <span className="animate-caret">|</span>
          </p>
        </div>

        {/* CTA 버튼 */}
        <div className="animate-fade-up-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/cases/new" className="btn-shimmer">
            ⚖️ 지금 사건 접수하기
          </Link>
          <Link href="/laws" className="btn-outline text-sm px-7 py-3.5">
            📜 법전 보기
          </Link>
        </div>

        {/* 장식 텍스트 */}
        <div className="animate-fade-up-4 mt-14 flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-yellow-900/40" />
          <span className="text-yellow-900/70 text-[10px] tracking-[0.35em] uppercase">The Court Is In Session</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-yellow-900/40" />
        </div>
      </section>

      {/* ── 통계 ─────────────────────────────────── */}
      <FadeIn>
        <section className="relative py-10 mb-14">
          <div className="absolute inset-0 border-y border-yellow-900/15" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_100%_at_50%_50%,rgba(201,168,76,0.03),transparent)]" />
          <div className="relative flex items-stretch justify-center divide-x divide-yellow-900/25">
            <StatItem target={caseCount}   label="접수된 사건" />
            <StatItem target={totalVotes}  label="배심원 투표" />
            <StatItem target={aiCount}     label="AI 판결 완료" />
          </div>
        </section>
      </FadeIn>

      {/* ── 이용 방법 ─────────────────────────────── */}
      <FadeIn delay={60}>
        <section className="mb-16">
          <p className="text-center text-yellow-800/80 text-[10px] tracking-[0.35em] uppercase mb-8">
            How It Works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: '📝',
                step: '01',
                title: '사건 접수',
                desc: '억울한 사연을 상세히 제출하세요. 원고·피고 양측의 진술을 기록합니다.',
              },
              {
                icon: '🤖',
                step: '02',
                title: 'AI 판사 심판',
                desc: 'Claude AI가 관계법정 법전에 근거하여 공정하고 권위 있는 판결을 내립니다.',
              },
              {
                icon: '🗳️',
                step: '03',
                title: '배심원 투표',
                desc: '전체 유저가 배심원이 되어 원고·피고·무승부 중 하나를 선택합니다.',
              },
            ].map(({ icon, step, title, desc }) => (
              <div key={step} className="step-card group">
                <div className="text-4xl mb-5 transition-transform duration-300 group-hover:scale-110">
                  {icon}
                </div>
                <div className="text-yellow-700/70 text-[10px] font-bold tracking-[0.3em] mb-2">
                  STEP {step}
                </div>
                <div
                  className="text-yellow-300 font-bold text-[15px] mb-3"
                  style={{ fontFamily: "'Noto Serif KR', serif" }}
                >
                  {title}
                </div>
                <div className="text-yellow-700/70 text-xs leading-relaxed">{desc}</div>
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
                className="text-lg font-bold text-yellow-300"
                style={{ fontFamily: "'Noto Serif KR', serif" }}
              >
                진행 중인 사건
              </h2>
              <p className="text-yellow-800/70 text-xs mt-0.5">
                총 {caseCount.toLocaleString()}건 · 최신순
              </p>
            </div>
            <Link
              href="/cases/new"
              className="text-yellow-700 hover:text-yellow-400 text-xs transition-colors
                border border-yellow-900/35 hover:border-yellow-700/40
                px-4 py-2 rounded-lg"
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
              <div className="text-5xl mb-4 opacity-30">📋</div>
              <p className="text-yellow-700 text-sm">아직 접수된 사건이 없습니다</p>
              <Link
                href="/cases/new"
                className="inline-block mt-4 text-yellow-600 hover:text-yellow-400 text-sm transition-colors"
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
