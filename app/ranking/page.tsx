'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getLevelInfo } from '@/lib/level'
import { CATEGORY_STYLE, type PostCategory } from '@/lib/types'

type TabType = 'cases' | 'jurors' | 'posts'

type RankedCase = {
  id: string
  title: string
  plaintiff_name: string
  defendant_name: string
  created_at: string
  voteCount: number
}

type RankedJuror = {
  id: string
  nickname: string
  level: number
  exp: number
  total_votes: number
}

type RankedPost = {
  id: string
  title: string
  category: PostCategory
  likes: number
  comment_count: number
  created_at: string
  profiles: { nickname: string; level: number } | null
}

const MEDAL = ['🥇', '🥈', '🥉']
const MEDAL_BORDER = [
  'border-yellow-500/40 bg-yellow-900/10',
  'border-zinc-500/40 bg-zinc-900/10',
  'border-amber-700/40 bg-amber-900/10',
]
const MEDAL_TEXT = [
  'text-yellow-400 font-black',
  'text-zinc-300 font-black',
  'text-amber-600 font-black',
]

const TABS: { key: TabType; label: string; emoji: string; desc: string }[] = [
  { key: 'cases',  label: '핫 사건',  emoji: '⚖️', desc: '투표수 TOP 10' },
  { key: 'jurors', label: '배심원',   emoji: '👤', desc: 'EXP TOP 20' },
  { key: 'posts',  label: '인기글',   emoji: '📝', desc: '좋아요 TOP 10' },
]

export default function RankingPage() {
  const [tab, setTab] = useState<TabType>('cases')
  const [cases, setCases] = useState<RankedCase[]>([])
  const [jurors, setJurors] = useState<RankedJuror[]>([])
  const [posts, setPosts] = useState<RankedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState<Set<TabType>>(new Set())

  useEffect(() => {
    if (loaded.has(tab)) return
    const load = async () => {
      setLoading(true)
      const supabase = createClient()

      if (tab === 'cases') {
        const { data } = await supabase
          .from('cases')
          .select('id, title, plaintiff_name, defendant_name, created_at, votes(vote)')
        const ranked = (data ?? [])
          .map(c => ({ ...c, voteCount: (c.votes as { vote: string }[]).length }))
          .sort((a, b) => b.voteCount - a.voteCount)
          .slice(0, 10) as RankedCase[]
        setCases(ranked)
      } else if (tab === 'jurors') {
        const { data } = await supabase
          .from('profiles')
          .select('id, nickname, level, exp, total_votes')
          .order('exp', { ascending: false })
          .limit(20)
        setJurors((data ?? []) as RankedJuror[])
      } else {
        const { data } = await supabase
          .from('posts')
          .select('id, title, category, likes, comment_count, created_at, profiles!user_id(nickname, level)')
          .order('likes', { ascending: false })
          .limit(10)
        setPosts((data ?? []) as RankedPost[])
      }

      setLoaded(prev => new Set(prev).add(tab))
      setLoading(false)
    }
    load()
  }, [tab, loaded])

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-yellow-400">🏆 랭킹</h1>
        <p className="text-yellow-700 text-xs mt-0.5">관계법정의 명예 전당</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-yellow-900/30">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'text-yellow-400 border-yellow-500'
                : 'text-yellow-700 border-transparent hover:text-yellow-500'
            }`}
          >
            <span>{t.emoji} {t.label}</span>
            <span className="hidden sm:inline text-xs text-current opacity-60 ml-1">· {t.desc}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-yellow-700">불러오는 중...</div>
      ) : (
        <>
          {tab === 'cases'  && <CasesRanking  cases={cases} />}
          {tab === 'jurors' && <JurorsRanking jurors={jurors} />}
          {tab === 'posts'  && <PostsRanking  posts={posts} />}
        </>
      )}
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank < 3) {
    return <span className="text-2xl w-8 text-center shrink-0">{MEDAL[rank]}</span>
  }
  return (
    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-900/20 text-yellow-800 text-xs font-bold shrink-0">
      {rank + 1}
    </span>
  )
}

function CasesRanking({ cases }: { cases: RankedCase[] }) {
  if (cases.length === 0) return <Empty message="아직 투표된 사건이 없습니다." />
  return (
    <div className="space-y-2">
      {cases.map((c, i) => (
        <Link key={c.id} href={`/cases/${c.id}`} className="block">
          <div className={`court-card p-4 hover:border-yellow-700/50 transition-colors flex items-center gap-3 ${i < 3 ? MEDAL_BORDER[i] : ''}`}>
            <RankBadge rank={i} />
            <div className="flex-1 min-w-0">
              <p className="text-yellow-100 font-semibold text-sm line-clamp-1 leading-snug">{c.title}</p>
              <p className="text-yellow-800 text-xs mt-0.5">
                {c.plaintiff_name} <span className="text-yellow-900">vs</span> {c.defendant_name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-bold text-sm ${i < 3 ? MEDAL_TEXT[i] : 'text-yellow-600'}`}>
                {c.voteCount.toLocaleString()}표
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function JurorsRanking({ jurors }: { jurors: RankedJuror[] }) {
  if (jurors.length === 0) return <Empty message="아직 등록된 배심원이 없습니다." />
  return (
    <div className="space-y-2">
      {jurors.map((j, i) => {
        const lvInfo = getLevelInfo(j.exp)
        return (
          <div key={j.id} className={`court-card p-4 flex items-center gap-3 ${i < 3 ? MEDAL_BORDER[i] : ''}`}>
            <RankBadge rank={i} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-yellow-100 font-semibold text-sm truncate">{j.nickname}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${lvInfo.badge}`}>
                  Lv.{j.level}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${lvInfo.color}`}>{lvInfo.title}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-bold text-sm ${i < 3 ? MEDAL_TEXT[i] : 'text-yellow-600'}`}>
                {j.exp.toLocaleString()} EXP
              </p>
              <p className="text-yellow-800 text-xs">{j.total_votes}회 투표</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PostsRanking({ posts }: { posts: RankedPost[] }) {
  if (posts.length === 0) return <Empty message="아직 좋아요를 받은 글이 없습니다." />
  return (
    <div className="space-y-2">
      {posts.map((p, i) => (
        <Link key={p.id} href={`/community/${p.id}`} className="block">
          <div className={`court-card p-4 hover:border-yellow-700/50 transition-colors flex items-center gap-3 ${i < 3 ? MEDAL_BORDER[i] : ''}`}>
            <RankBadge rank={i} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${CATEGORY_STYLE[p.category]}`}>
                  {p.category}
                </span>
              </div>
              <p className="text-yellow-100 font-semibold text-sm line-clamp-1 leading-snug">{p.title}</p>
              <p className="text-yellow-800 text-xs mt-0.5">{p.profiles?.nickname ?? '(알 수 없음)'}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-bold text-sm ${i < 3 ? MEDAL_TEXT[i] : 'text-yellow-600'}`}>
                💛 {p.likes.toLocaleString()}
              </p>
              <p className="text-yellow-800 text-xs">💬 {p.comment_count}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function Empty({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-yellow-800">
      <p className="text-4xl mb-3">🏆</p>
      <p>{message}</p>
    </div>
  )
}
