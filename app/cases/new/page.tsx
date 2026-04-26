'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = ['연애', '우정', '가족', '직장', '금전', '기타']

export default function NewCasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState('연애')
  const [form, setForm] = useState({
    title: '',
    plaintiff_name: '',
    defendant_name: '',
    plaintiff_statement: '',
    defendant_statement: '',
  })

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.plaintiff_name.trim() || !form.defendant_name.trim() || !form.plaintiff_statement.trim()) {
      setError('필수 항목을 모두 입력해주세요.')
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error: dbError } = await supabase
      .from('cases')
      .insert({
        title: `[${category}] ${form.title.trim()}`,
        plaintiff_name: form.plaintiff_name.trim(),
        defendant_name: form.defendant_name.trim(),
        plaintiff_statement: form.plaintiff_statement.trim(),
        defendant_statement: form.defendant_statement.trim() || null,
        plaintiff_user_id: user?.id ?? null,
        status: 'open',
      })
      .select()
      .single()

    if (dbError) {
      setError('사건 접수 중 오류가 발생했습니다: ' + dbError.message)
      setLoading(false)
    } else {
      router.push(`/cases/${data.id}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/" className="text-yellow-700 hover:text-yellow-500 text-sm flex items-center gap-1">
          ← 목록으로
        </Link>
        <h1 className="text-3xl font-black text-yellow-400 mt-3 mb-1">사건 접수</h1>
        <p className="text-yellow-700 text-sm">억울한 사연을 솔직하게 작성해주세요. AI 판사가 공정하게 심판합니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category */}
        <div className="court-card p-5">
          <label className="section-title block mb-3">사건 분류</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  category === cat
                    ? 'bg-yellow-600 text-black'
                    : 'border border-yellow-800/50 text-yellow-600 hover:border-yellow-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Basic info */}
        <div className="court-card p-5 space-y-4">
          <div>
            <label className="section-title block mb-2">
              사건명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="예: 카톡 읽씹 3시간 후 바빴어는 변명인가?"
              maxLength={100}
              className="w-full bg-[#0c0802] border border-yellow-900/40 rounded-lg px-4 py-3 text-yellow-100 placeholder-yellow-900 focus:outline-none focus:border-yellow-600 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="section-title block mb-2">
                원고 이름 <span className="text-red-500">*</span>
                <span className="ml-1 text-yellow-800 normal-case font-normal">(나)</span>
              </label>
              <input
                type="text"
                value={form.plaintiff_name}
                onChange={set('plaintiff_name')}
                placeholder="예: 민지"
                maxLength={20}
                className="w-full bg-[#0c0802] border border-red-900/40 rounded-lg px-4 py-3 text-red-300 placeholder-red-900 focus:outline-none focus:border-red-600 transition-colors"
              />
            </div>
            <div>
              <label className="section-title block mb-2">
                피고 이름 <span className="text-red-500">*</span>
                <span className="ml-1 text-yellow-800 normal-case font-normal">(상대방)</span>
              </label>
              <input
                type="text"
                value={form.defendant_name}
                onChange={set('defendant_name')}
                placeholder="예: 준혁"
                maxLength={20}
                className="w-full bg-[#0c0802] border border-blue-900/40 rounded-lg px-4 py-3 text-blue-300 placeholder-blue-900 focus:outline-none focus:border-blue-600 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Statements */}
        <div className="court-card p-5 space-y-5">
          <div>
            <label className="section-title block mb-1">
              <span className="text-red-400">원고 진술</span> (내 입장)
              <span className="text-red-500 ml-1">*</span>
            </label>
            <p className="text-yellow-800 text-xs mb-2">구체적으로 작성할수록 더 정확한 판결이 나옵니다.</p>
            <textarea
              value={form.plaintiff_statement}
              onChange={set('plaintiff_statement')}
              placeholder="상황을 자세히 설명해주세요. 언제, 무슨 일이 있었나요? 왜 억울한가요?"
              rows={6}
              maxLength={2000}
              className="w-full bg-[#0c0802] border border-red-900/40 rounded-lg px-4 py-3 text-yellow-100 placeholder-yellow-900 focus:outline-none focus:border-red-600 transition-colors resize-none leading-relaxed"
            />
            <div className="text-right text-yellow-900 text-xs mt-1">{form.plaintiff_statement.length}/2000</div>
          </div>

          <div className="gavel-divider">
            <span className="text-yellow-800 text-sm">피고 측 진술 (선택)</span>
          </div>

          <div>
            <label className="section-title block mb-1">
              <span className="text-blue-400">피고 진술</span> (상대방 입장)
              <span className="text-yellow-700 text-xs font-normal ml-2">— 알고 있다면 대신 입력하거나 비워두세요</span>
            </label>
            <textarea
              value={form.defendant_statement}
              onChange={set('defendant_statement')}
              placeholder="상대방이 주장하는 입장이나 변명을 적어주세요. (없으면 AI가 원고 진술만으로 판단합니다)"
              rows={4}
              maxLength={2000}
              className="w-full bg-[#0c0802] border border-blue-900/40 rounded-lg px-4 py-3 text-yellow-100 placeholder-yellow-900 focus:outline-none focus:border-blue-600 transition-colors resize-none leading-relaxed"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full py-4 text-base"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              접수 중...
            </span>
          ) : '⚖️ 사건 접수하기'}
        </button>

        <p className="text-center text-yellow-900 text-xs">
          접수된 사건은 모든 배심원에게 공개됩니다. 실명 사용을 자제해 주세요.
        </p>
      </form>
    </div>
  )
}
