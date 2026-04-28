export type VoteType = 'plaintiff' | 'defendant' | 'neutral'

export type Profile = {
  id: string
  nickname: string
  gender: 'male' | 'female' | 'other'
  age: number
  exp: number
  level: number
  total_votes: number
  created_at: string
}

export type Case = {
  id: string
  title: string
  plaintiff_name: string
  defendant_name: string
  plaintiff_statement: string
  defendant_statement: string | null
  plaintiff_user_id: string | null
  status: 'open' | 'closed'
  ai_verdict: string | null
  ai_verdict_winner: VoteType | null
  created_at: string
  updated_at: string
}

export type Vote = {
  id: string
  case_id: string
  user_id: string
  vote: VoteType
  created_at: string
}

export type VoteCounts = {
  plaintiff: number
  defendant: number
  neutral: number
  total: number
}

export type PostCategory = '자유' | '사연공유' | '판결결과' | '질문'

export const POST_CATEGORIES: PostCategory[] = ['자유', '사연공유', '판결결과', '질문']

export const CATEGORY_STYLE: Record<PostCategory, string> = {
  '자유':    'bg-zinc-700/60 text-zinc-300',
  '사연공유': 'bg-rose-900/60 text-rose-300',
  '판결결과': 'bg-blue-900/60 text-blue-300',
  '질문':    'bg-green-900/60 text-green-300',
}

export type Post = {
  id: string
  user_id: string | null
  title: string
  content: string
  category: PostCategory
  likes: number
  comment_count: number
  created_at: string
  profiles: { nickname: string; level: number } | null
}

export type Comment = {
  id: string
  post_id: string
  user_id: string | null
  content: string
  created_at: string
  profiles: { nickname: string; level: number } | null
}

export type LawCategory = '연애' | '우정' | '가족' | '직장학교' | '소셜미디어'

export const LAW_CATEGORIES: LawCategory[] = ['연애', '우정', '가족', '직장학교', '소셜미디어']

export const LAW_CATEGORY_STYLE: Record<LawCategory, string> = {
  '연애':     'bg-rose-900/60 text-rose-300',
  '우정':     'bg-blue-900/60 text-blue-300',
  '가족':     'bg-purple-900/60 text-purple-300',
  '직장학교': 'bg-amber-900/60 text-amber-300',
  '소셜미디어': 'bg-green-900/60 text-green-300',
}

export type Law = {
  id: string
  article_number: number
  title: string
  content: string
  category: LawCategory
  created_at: string
}
