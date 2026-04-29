'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getLevelInfo } from '@/lib/level'
import { CATEGORY_STYLE, type PostCategory } from '@/lib/types'

type Tab = 'dashboard' | 'users' | 'cases' | 'community'

// ── 타입 ─────────────────────────────────────────────
type Stats = {
  todayUsers: number;  totalUsers: number
  todayCases: number;  totalCases: number
  todayVotes: number;  totalVotes: number
  todayPosts: number;  totalPosts: number
}

type AdminUser = {
  id: string
  nickname: string
  email: string
  gender: string
  age: number
  level: number
  exp: number
  total_votes: number
  created_at: string
}

type AdminCase = {
  id: string
  title: string
  plaintiff_name: string
  defendant_name: string
  ai_verdict: string | null
  created_at: string
  votes: { vote: string }[]
}

type AdminPost = {
  id: string
  title: string
  category: PostCategory
  likes: number
  comment_count: number
  created_at: string
  profiles: { nickname: string } | null
}

// ── 유틸 ─────────────────────────────────────────────
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', year: '2-digit' })
}

function todayStart() {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString()
}

// ── 컴포넌트 ──────────────────────────────────────────
export function AdminClient() {
  const [tab, setTab]           = useState<Tab>('dashboard')
  const [stats, setStats]       = useState<Stats | null>(null)
  const [users, setUsers]       = useState<AdminUser[]>([])
  const [cases, setCases]       = useState<AdminCase[]>([])
  const [posts, setPosts]       = useState<AdminPost[]>([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const loaded                  = useRef<Set<Tab>>(new Set())

  useEffect(() => { loadTab(tab) }, [tab])

  async function loadTab(t: Tab) {
    if (loaded.current.has(t)) return
    setLoading(true)
    const sb   = createClient()
    const ts   = todayStart()

    if (t === 'dashboard') {
      const [
        { count: tu }, { count: tdu },
        { count: tc }, { count: tdc },
        { count: tv }, { count: tdv },
        { count: tp }, { count: tdp },
      ] = await Promise.all([
        sb.from('profiles').select('*', { count: 'exact', head: true }),
        sb.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', ts),
        sb.from('cases').select('*', { count: 'exact', head: true }),
        sb.from('cases').select('*', { count: 'exact', head: true }).gte('created_at', ts),
        sb.from('votes').select('*', { count: 'exact', head: true }),
        sb.from('votes').select('*', { count: 'exact', head: true }).gte('created_at', ts),
        sb.from('posts').select('*', { count: 'exact', head: true }),
        sb.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', ts),
      ])
      setStats({
        totalUsers: tu ?? 0, todayUsers: tdu ?? 0,
        totalCases: tc ?? 0, todayCases: tdc ?? 0,
        totalVotes: tv ?? 0, todayVotes: tdv ?? 0,
        totalPosts: tp ?? 0, todayPosts: tdp ?? 0,
      })
    }

    if (t === 'users') {
      const [{ data }, emailRes] = await Promise.all([
        sb
          .from('profiles')
          .select('id, nickname, gender, age, level, exp, total_votes, created_at')
          .order('created_at', { ascending: false })
          .limit(200),
        fetch('/api/admin/users').then(r => r.json()),
      ])
      const emailMap: Record<string, string> = emailRes ?? {}
      const merged = (data ?? []).map((u: any) => ({ ...u, email: emailMap[u.id] ?? '' }))
      setUsers(merged as AdminUser[])
    }

    if (t === 'cases') {
      const { data } = await sb
        .from('cases')
        .select('id, title, plaintiff_name, defendant_name, ai_verdict, created_at, votes(vote)')
        .order('created_at', { ascending: false })
        .limit(100)
      setCases((data ?? []) as AdminCase[])
    }

    if (t === 'community') {
      const { data } = await sb
        .from('posts')
        .select('id, title, category, likes, comment_count, created_at, profiles!user_id(nickname)')
        .order('created_at', { ascending: false })
        .limit(100)
      const normalized = (data ?? []).map((r: any) => ({
        ...r,
        profiles: Array.isArray(r.profiles) ? r.profiles[0] ?? null : r.profiles,
      }))
      setPosts(normalized as AdminPost[])
    }

    loaded.current.add(t)
    setLoading(false)
  }

  async function deleteItem(type: 'case' | 'post', id: string, label: string) {
    if (!confirm(`"${label}" 을 삭제하시겠습니까?`)) return
    const res = await fetch('/api/admin/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      alert(`삭제 실패: ${body.error ?? res.status}`)
      return
    }
    if (type === 'case') setCases(p => p.filter(c => c.id !== id))
    else setPosts(p => p.filter(c => c.id !== id))
  }

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'dashboard',  label: '대시보드',    icon: '📊' },
    { key: 'users',      label: '유저 관리',   icon: '👤' },
    { key: 'cases',      label: '사건 관리',   icon: '⚖️' },
    { key: 'community',  label: '커뮤니티',    icon: '📝' },
  ]

  const filteredUsers = search.trim()
    ? users.filter(u => u.nickname.toLowerCase().includes(search.toLowerCase()))
    : users

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* 헤더 */}
      <div className="flex items-center gap-3 pb-1">
        <div className="w-8 h-8 rounded-lg bg-red-900/40 border border-red-800/50 flex items-center justify-center text-sm">
          🔐
        </div>
        <div>
          <h1 className="text-lg font-bold text-yellow-300">관리자 패널</h1>
          <p className="text-yellow-800 text-xs">sinuilyeong19@gmail.com</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-yellow-900/25 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === t.key
                ? 'text-yellow-400 border-yellow-500'
                : 'text-yellow-700 border-transparent hover:text-yellow-500'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="text-center py-12 text-yellow-700 text-sm">불러오는 중...</div>
      )}

      {/* ── 대시보드 ─────────────────────────────── */}
      {!loading && tab === 'dashboard' && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '👤', label: '유저',    today: stats.todayUsers, total: stats.totalUsers },
            { icon: '⚖️', label: '사건',    today: stats.todayCases, total: stats.totalCases },
            { icon: '🗳️', label: '투표',    today: stats.todayVotes, total: stats.totalVotes },
            { icon: '📝', label: '게시글',  today: stats.todayPosts, total: stats.totalPosts },
          ].map(({ icon, label, today, total }) => (
            <div key={label} className="court-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{icon}</span>
                <span className="text-yellow-600 text-xs font-medium">{label}</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-yellow-800 text-xs">오늘</span>
                  <span className="text-yellow-400 font-black text-xl tabular-nums">
                    +{today.toLocaleString()}
                  </span>
                </div>
                <div className="h-px bg-yellow-900/20" />
                <div className="flex items-baseline justify-between">
                  <span className="text-yellow-800 text-xs">전체</span>
                  <span className="text-yellow-600 font-bold text-sm tabular-nums">
                    {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 유저 관리 ─────────────────────────────── */}
      {!loading && tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="닉네임 검색..."
              className="flex-1 bg-[#111008] border border-yellow-900/35 rounded-lg px-4 py-2 text-yellow-100 text-sm placeholder-yellow-900 focus:outline-none focus:border-yellow-700/50 transition-colors"
            />
            <span className="text-yellow-800 text-xs whitespace-nowrap">
              {filteredUsers.length}명
            </span>
          </div>

          <div className="court-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-yellow-900/25">
                    {['닉네임', '이메일', '레벨', 'EXP', '투표', '성별/나이', '가입일'].map(h => (
                      <th key={h} className="text-left text-yellow-700 text-xs font-medium px-4 py-2.5 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => {
                    const lv = getLevelInfo(u.exp)
                    return (
                      <tr
                        key={u.id}
                        className={`border-b border-yellow-900/10 hover:bg-yellow-900/5 transition-colors ${
                          i % 2 === 0 ? '' : 'bg-yellow-900/[0.02]'
                        }`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-yellow-900/40 flex items-center justify-center text-xs font-bold text-yellow-500 shrink-0">
                              {u.nickname[0]}
                            </div>
                            <span className="text-yellow-100 font-medium">{u.nickname}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-yellow-700 text-xs whitespace-nowrap">
                          {u.email || '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${lv.badge}`}>
                            Lv.{u.level}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-yellow-600 tabular-nums text-xs">
                          {u.exp.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-yellow-700 tabular-nums text-xs">
                          {u.total_votes.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-yellow-800 text-xs">
                          {u.gender === 'male' ? '남' : u.gender === 'female' ? '여' : '기타'} / {u.age}세
                        </td>
                        <td className="px-4 py-2.5 text-yellow-800 text-xs whitespace-nowrap">
                          {fmtDate(u.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-yellow-800 text-sm">
                        유저가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 사건 관리 ─────────────────────────────── */}
      {!loading && tab === 'cases' && (
        <div className="court-card overflow-hidden">
          <div className="px-4 py-3 border-b border-yellow-900/20 flex items-center justify-between">
            <span className="text-yellow-600 text-xs font-medium">총 {cases.length}건</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-yellow-900/20">
                  {['제목', '원고 vs 피고', '투표', 'AI판결', '날짜', ''].map((h, i) => (
                    <th key={i} className="text-left text-yellow-700 text-xs font-medium px-4 py-2.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-b border-yellow-900/10 hover:bg-yellow-900/5 transition-colors ${
                      i % 2 === 0 ? '' : 'bg-yellow-900/[0.02]'
                    }`}
                  >
                    <td className="px-4 py-2.5 max-w-[220px]">
                      <span className="text-yellow-100 text-xs line-clamp-1">{c.title}</span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs">
                      <span className="text-red-400">{c.plaintiff_name}</span>
                      <span className="text-yellow-800 mx-1">vs</span>
                      <span className="text-blue-400">{c.defendant_name}</span>
                    </td>
                    <td className="px-4 py-2.5 text-yellow-600 text-xs tabular-nums">
                      {c.votes.length}표
                    </td>
                    <td className="px-4 py-2.5">
                      {c.ai_verdict ? (
                        <span className="text-xs text-green-500 bg-green-900/20 px-1.5 py-0.5 rounded">완료</span>
                      ) : (
                        <span className="text-xs text-yellow-800 bg-yellow-900/10 px-1.5 py-0.5 rounded">대기</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-yellow-800 text-xs whitespace-nowrap">
                      {timeAgo(c.created_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => deleteItem('case', c.id, c.title)}
                        className="text-xs text-red-700 hover:text-red-400 transition-colors px-2 py-1 rounded border border-red-900/20 hover:border-red-700/40"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
                {cases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-yellow-800 text-sm">
                      사건이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 커뮤니티 관리 ─────────────────────────── */}
      {!loading && tab === 'community' && (
        <div className="court-card overflow-hidden">
          <div className="px-4 py-3 border-b border-yellow-900/20 flex items-center justify-between">
            <span className="text-yellow-600 text-xs font-medium">총 {posts.length}개</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-yellow-900/20">
                  {['카테고리', '제목', '작성자', '좋아요', '댓글', '날짜', ''].map((h, i) => (
                    <th key={i} className="text-left text-yellow-700 text-xs font-medium px-4 py-2.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-b border-yellow-900/10 hover:bg-yellow-900/5 transition-colors ${
                      i % 2 === 0 ? '' : 'bg-yellow-900/[0.02]'
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_STYLE[p.category]}`}>
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 max-w-[200px]">
                      <span className="text-yellow-100 text-xs line-clamp-1">{p.title}</span>
                    </td>
                    <td className="px-4 py-2.5 text-yellow-700 text-xs whitespace-nowrap">
                      {p.profiles?.nickname ?? '(알 수 없음)'}
                    </td>
                    <td className="px-4 py-2.5 text-yellow-600 text-xs tabular-nums">
                      💛 {p.likes}
                    </td>
                    <td className="px-4 py-2.5 text-yellow-700 text-xs tabular-nums">
                      💬 {p.comment_count}
                    </td>
                    <td className="px-4 py-2.5 text-yellow-800 text-xs whitespace-nowrap">
                      {timeAgo(p.created_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => deleteItem('post', p.id, p.title)}
                        className="text-xs text-red-700 hover:text-red-400 transition-colors px-2 py-1 rounded border border-red-900/20 hover:border-red-700/40"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-yellow-800 text-sm">
                      게시글이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
