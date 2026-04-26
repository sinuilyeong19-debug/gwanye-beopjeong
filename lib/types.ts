export type VoteType = 'plaintiff' | 'defendant' | 'neutral'

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
