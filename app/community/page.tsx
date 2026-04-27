'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getLevelInfo } from '@/lib/level'
import { POST_CATEGORIES, CATEGORY_STYLE, type Post, type PostCategory } from '@/lib/types'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

type SortType = '최신순' | '인기순'

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [category, setCategory] = useState<PostCategory | '전체'>('전체')
  const [sort, setSort] = useState<SortType>('최신순')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const supabase = createClient()
      let query = supabase
        .from('posts')
        .select('*, profiles!user_id(nickname, level)')

      if (category !== '전체') query = query.eq('category', category)
      query = query.order(sort === '인기순' ? 'likes' : 'created_at', { ascending: false })

      const { data } = await query
      setPosts((data ?? []) as Post[])
      setLoading(false)
    }
    fetch()
  }, [category, sort])

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-yellow-400">커뮤니티</h1>
          <p className="text-yellow-700 text-xs mt-0.5">배심원들의 이야기</p>
        </div>
        <Link href="/community/new" className="btn-gold text-sm">+ 글쓰기</Link>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 flex-wrap">
        {(['전체', ...POST_CATEGORIES] as const).map(cat => (
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

      {/* 정렬 */}
      <div className="flex gap-2">
        {(['최신순', '인기순'] as SortType[]).map(s => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`text-xs px-3 py-1 rounded transition-colors ${
              sort === s ? 'text-yellow-400 font-semibold' : 'text-yellow-700 hover:text-yellow-500'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 게시글 목록 */}
      {loading ? (
        <div className="text-center py-16 text-yellow-700">불러오는 중...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-yellow-800">
          <p className="text-4xl mb-3">📭</p>
          <p>아직 게시글이 없습니다.</p>
          <Link href="/community/new" className="text-yellow-600 hover:text-yellow-400 text-sm mt-2 inline-block">
            첫 글을 작성해보세요 →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}

function PostCard({ post }: { post: Post }) {
  const levelInfo = post.profiles ? getLevelInfo(post.profiles.level === 1 ? 0 : post.profiles.level * 100) : null

  return (
    <Link href={`/community/${post.id}`} className="block">
      <div className="court-card p-4 hover:border-yellow-700/50 transition-colors">
        <div className="flex items-start gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${CATEGORY_STYLE[post.category]}`}>
            {post.category}
          </span>
          <h2 className="text-yellow-100 font-semibold text-sm leading-snug line-clamp-1">{post.title}</h2>
        </div>
        <p className="text-yellow-700 text-xs line-clamp-1 mb-3">{post.content}</p>
        <div className="flex items-center justify-between text-xs text-yellow-800">
          <div className="flex items-center gap-1.5">
            <span>{post.profiles?.nickname ?? '(알 수 없음)'}</span>
            {post.profiles && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${levelInfo?.badge ?? ''}`}>
                Lv.{post.profiles.level}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span>💛 {post.likes}</span>
            <span>💬 {post.comment_count}</span>
            <span>{timeAgo(post.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
