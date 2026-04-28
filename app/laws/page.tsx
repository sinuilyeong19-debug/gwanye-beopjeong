'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LAW_CATEGORIES, LAW_CATEGORY_STYLE, type Law, type LawCategory } from '@/lib/types'

export default function LawsPage() {
  const [laws, setLaws] = useState<Law[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<LawCategory | '전체'>('전체')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('laws')
        .select('*')
        .order('article_number')
      setLaws((data ?? []) as Law[])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return laws.filter(l => {
      const matchCat = category === '전체' || l.category === category
      const matchQ = !q || l.title.toLowerCase().includes(q) || l.content.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [laws, category, query])

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-black text-yellow-400">📜 관계법정 법전</h1>
        <p className="text-yellow-700 text-xs mt-0.5">인간관계 분쟁을 다스리는 관계법정의 조항들</p>
      </div>

      {/* 검색 */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-800">🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="죄명 또는 내용으로 검색..."
          className="w-full bg-[#0c0802] border border-yellow-900/40 rounded-lg pl-9 pr-4 py-2.5 text-yellow-100 placeholder-yellow-900 focus:outline-none focus:border-yellow-600 transition-colors text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-800 hover:text-yellow-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 flex-wrap">
        {(['전체', ...LAW_CATEGORIES] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              category === cat
                ? 'bg-yellow-600 text-black border-yellow-600'
                : 'border-yellow-800/50 text-yellow-600 hover:border-yellow-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 건수 */}
      {!loading && (
        <p className="text-yellow-800 text-xs">
          총 {filtered.length}개 조항
        </p>
      )}

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-16 text-yellow-700">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-yellow-800">
          <p className="text-3xl mb-3">📭</p>
          <p>검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(law => (
            <LawCard key={law.id} law={law} query={query} />
          ))}
        </div>
      )}
    </div>
  )
}

function LawCard({ law, query }: { law: Law; query: string }) {
  return (
    <div className="court-card p-5">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-12 h-12 rounded-xl bg-yellow-900/20 border border-yellow-800/30 flex flex-col items-center justify-center">
          <span className="text-yellow-600 text-[10px]">제</span>
          <span className="text-yellow-400 font-black text-lg leading-none">{law.article_number}</span>
          <span className="text-yellow-600 text-[10px]">조</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h2 className="text-yellow-100 font-bold text-sm">
              <Highlight text={law.title} query={query} />
            </h2>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${LAW_CATEGORY_STYLE[law.category]}`}>
              {law.category}
            </span>
          </div>
          <p className="text-yellow-700 text-xs leading-relaxed">
            <Highlight text={law.content} query={query} />
          </p>
        </div>
      </div>
    </div>
  )
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const q = query.trim()
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-yellow-700/40 text-yellow-300 rounded px-0.5">{part}</mark>
          : part
      )}
    </>
  )
}
