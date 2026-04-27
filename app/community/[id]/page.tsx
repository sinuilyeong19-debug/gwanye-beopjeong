'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getLevelInfo } from '@/lib/level'
import { CATEGORY_STYLE, type Post, type Comment } from '@/lib/types'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()

      const [{ data: { user } }, { data: postData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('posts').select('*, profiles!user_id(nickname, level)').eq('id', id).single(),
      ])

      if (!postData) { setNotFound(true); return }
      setPost(postData as Post)
      setLikeCount(postData.likes)
      setUserId(user?.id ?? null)

      if (user) {
        const { data: likeData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .maybeSingle()
        setLiked(!!likeData)
      }

      loadComments()
    }
    load()
  }, [id])

  const loadComments = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('comments')
      .select('*, profiles!user_id(nickname, level)')
      .eq('post_id', id)
      .order('created_at', { ascending: true })
    setComments((data ?? []) as Comment[])
  }

  const handleLike = async () => {
    if (!userId) {
      const supabase = createClient()
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/community/${id}` },
      })
      return
    }
    if (likeLoading) return
    setLikeLoading(true)

    const supabase = createClient()
    const { data: nowLiked } = await supabase.rpc('toggle_post_like', {
      p_post_id: id,
      p_user_id: userId,
    })
    setLiked(!!nowLiked)
    setLikeCount(c => nowLiked ? c + 1 : Math.max(0, c - 1))
    setLikeLoading(false)
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    if (!userId) return
    setSubmittingComment(true)

    const supabase = createClient()
    await supabase.from('comments').insert({
      post_id: id,
      user_id: userId,
      content: commentText.trim(),
    })
    setCommentText('')
    await loadComments()
    setSubmittingComment(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    const supabase = createClient()
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(cs => cs.filter(c => c.id !== commentId))
  }

  if (notFound) {
    return (
      <div className="text-center py-20 text-yellow-700">
        <p className="text-4xl mb-3">🔍</p>
        <p>존재하지 않는 게시글입니다.</p>
        <Link href="/community" className="text-yellow-600 hover:text-yellow-400 text-sm mt-2 inline-block">← 커뮤니티로</Link>
      </div>
    )
  }

  if (!post) {
    return <div className="text-center py-20 text-yellow-700">불러오는 중...</div>
  }

  const authorLevel = post.profiles ? getLevelInfo(post.profiles.level === 1 ? 0 : post.profiles.level * 100) : null

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link href="/community" className="text-yellow-700 hover:text-yellow-500 text-sm flex items-center gap-1">
        ← 커뮤니티로
      </Link>

      {/* 게시글 본문 */}
      <div className="court-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_STYLE[post.category]}`}>
            {post.category}
          </span>
        </div>
        <h1 className="text-xl font-bold text-yellow-100 mb-4 leading-snug">{post.title}</h1>

        <div className="flex items-center gap-2 mb-5 text-xs text-yellow-700">
          <span>{post.profiles?.nickname ?? '(알 수 없음)'}</span>
          {post.profiles && authorLevel && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${authorLevel.badge}`}>
              Lv.{post.profiles.level}
            </span>
          )}
          <span className="text-yellow-900">·</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>

        <p className="text-yellow-100/90 leading-relaxed whitespace-pre-wrap text-sm">{post.content}</p>

        {/* 좋아요 */}
        <div className="mt-6 pt-4 border-t border-yellow-900/30 flex items-center gap-3">
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              liked
                ? 'bg-yellow-900/40 border-yellow-600 text-yellow-400'
                : 'border-yellow-800/40 text-yellow-700 hover:border-yellow-600 hover:text-yellow-500'
            }`}
          >
            💛 {likeCount}
          </button>
          <span className="text-yellow-800 text-xs">💬 댓글 {comments.length}</span>
        </div>
      </div>

      {/* 댓글 섹션 */}
      <div className="court-card p-5">
        <h2 className="section-title mb-4">댓글 {comments.length}개</h2>

        <div className="space-y-4 mb-5">
          {comments.length === 0 ? (
            <p className="text-yellow-800 text-sm text-center py-4">아직 댓글이 없습니다.</p>
          ) : (
            comments.map(comment => {
              const cLevel = comment.profiles
                ? getLevelInfo(comment.profiles.level === 1 ? 0 : comment.profiles.level * 100)
                : null
              return (
                <div key={comment.id} className="border-b border-yellow-900/20 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-yellow-700">
                      <span>{comment.profiles?.nickname ?? '(알 수 없음)'}</span>
                      {comment.profiles && cLevel && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${cLevel.badge}`}>
                          Lv.{comment.profiles.level}
                        </span>
                      )}
                      <span className="text-yellow-900">·</span>
                      <span>{timeAgo(comment.created_at)}</span>
                    </div>
                    {comment.user_id === userId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-yellow-900 hover:text-red-500 text-xs transition-colors"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="text-yellow-100/80 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                </div>
              )
            })
          )}
        </div>

        {/* 댓글 입력 */}
        {userId ? (
          <form onSubmit={handleComment} className="space-y-2">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="댓글을 입력하세요..."
              rows={3}
              maxLength={500}
              className="w-full bg-[#0c0802] border border-yellow-900/40 rounded-lg px-4 py-3 text-yellow-100 placeholder-yellow-900 focus:outline-none focus:border-yellow-600 transition-colors resize-none text-sm"
            />
            <div className="flex items-center justify-between">
              <span className="text-yellow-900 text-xs">{commentText.length}/500</span>
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="btn-gold text-sm px-5 py-2 disabled:opacity-40"
              >
                {submittingComment ? '등록 중...' : '댓글 등록'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 border border-yellow-900/30 rounded-lg">
            <p className="text-yellow-700 text-sm mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
            <button
              onClick={() => {
                const supabase = createClient()
                supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: `${window.location.origin}/auth/callback?next=/community/${id}` },
                })
              }}
              className="btn-gold text-xs px-5 py-2"
            >
              구글로 로그인
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
