'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ nickname: '', gender: '', age: '' })

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) { router.replace('/'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profile) { router.replace('/'); return }

      setChecking(false)
    }
    check()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nickname.trim() || !form.gender || !form.age) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    const age = parseInt(form.age)
    if (isNaN(age) || age < 1 || age > 120) {
      setError('올바른 나이를 입력해주세요.')
      return
    }

    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/'); return }

    const { error: dbError } = await supabase
      .from('profiles')
      .insert({ id: user.id, nickname: form.nickname.trim(), gender: form.gender, age })

    if (dbError) {
      setError('저장 중 오류가 발생했습니다: ' + dbError.message)
      setSubmitting(false)
    } else {
      router.replace('/')
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-yellow-700">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="mb-8 text-center">
        <div className="text-5xl mb-4">⚖️</div>
        <h1 className="text-3xl font-black text-yellow-400 mb-2">배심원 등록</h1>
        <p className="text-yellow-700 text-sm">
          관계법정에 오신 것을 환영합니다.<br />
          간단한 정보를 입력하고 시작하세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="court-card p-6 space-y-6">
        {/* 닉네임 */}
        <div>
          <label className="section-title block mb-2">
            닉네임 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.nickname}
            onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
            placeholder="예: 정의로운판사"
            maxLength={20}
            className="w-full bg-[#0c0802] border border-yellow-900/40 rounded-lg px-4 py-3 text-yellow-100 placeholder-yellow-900 focus:outline-none focus:border-yellow-600 transition-colors"
          />
          <div className="text-right text-yellow-900 text-xs mt-1">{form.nickname.length}/20</div>
        </div>

        {/* 성별 */}
        <div>
          <label className="section-title block mb-3">
            성별 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            {([['male', '남성'], ['female', '여성'], ['other', '기타']] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm(f => ({ ...f, gender: value }))}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                  form.gender === value
                    ? 'bg-yellow-600 text-black border-yellow-600'
                    : 'border-yellow-800/50 text-yellow-600 hover:border-yellow-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 나이 */}
        <div>
          <label className="section-title block mb-2">
            나이 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.age}
            onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
            placeholder="나이를 입력하세요"
            min={1}
            max={120}
            className="w-full bg-[#0c0802] border border-yellow-900/40 rounded-lg px-4 py-3 text-yellow-100 placeholder-yellow-900 focus:outline-none focus:border-yellow-600 transition-colors"
          />
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-gold w-full py-4 text-base"
        >
          {submitting ? '저장 중...' : '배심원 등록 완료'}
        </button>
      </form>
    </div>
  )
}
