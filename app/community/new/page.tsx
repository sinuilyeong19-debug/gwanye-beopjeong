'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { POST_CATEGORIES, CATEGORY_STYLE, type PostCategory } from '@/lib/types'

export default function NewPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<PostCategory>('자유')
  const [form, setForm] = useState({ title: '', content: '' })

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.')
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('로그인이 필요합니다.'); setLoading(false); return }

    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
    if (!profile) { setError('프로필을 먼저 설정해주세요.'); setLoading(false); return }

    const { data, error: dbError } = await supabase
      .from('posts')
      .insert({ user_id: user.id, title: form.title.trim(), content: form.content.trim(), category })
      .select('id')
      .single()

    if (dbError) {
      setError('글 작성 중 오류가 발생했습니다: ' + dbError.message)
      setLoading(false)
    } else {
      router.push(`/community/${data.id}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/community" className="text-yellow-700 hover:text-yellow-500 text-sm flex items-center gap-1">
          ← 커뮤니티로
        </Link>
        <h1 className="text-2xl font-black text-yellow-400 mt-3">글쓰기</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 카테고리 */}
        <div className="court-card p-5">
          <label className="section-title block mb-3">카테고리</label>
          <div className="flex gap-2 flex-wrap">
            {POST_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  category === cat
                    ? 'bg-yellow-600 text-black border-yellow-600'
                    : 'border-yellow-800/50 text-yellow-600 hover:border-yellow-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 + 내용 */}
        <div className="court-card p-5 space-y-4">
          <div>
            <label className="section-title block mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="제목을 입력하세요"
              maxLength={100}
              className="w-full bg-[#0c0802] border border-yellow-900/40 rounded-lg px-4 py-3 text-yellow-100 placeholder-yellow-900 focus:outline-none focus:border-yellow-600 transition-colors"
            />
            <div className="text-right text-yellow-900 text-xs mt-1">{form.title.length}/100</div>
          </div>
          <div>
            <label className="section-title block mb-2">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={set('content')}
              placeholder="내용을 자유롭게 작성해주세요."
              rows={10}
              maxLength={5000}
              className="w-full bg-[#0c0802] border border-yellow-900/40 rounded-lg px-4 py-3 text-yellow-100 placeholder-yellow-900 focus:outline-none focus:border-yellow-600 transition-colors resize-none leading-relaxed"
            />
            <div className="text-right text-yellow-900 text-xs mt-1">{form.content.length}/5000</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-gold w-full py-4 text-base">
          {loading ? '등록 중...' : '게시글 등록'}
        </button>
      </form>
    </div>
  )
}
