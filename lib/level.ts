export type LevelInfo = {
  level: number
  title: string
  minExp: number
  maxExp: number | null
  color: string
  badge: string
}

export const LEVELS: LevelInfo[] = [
  { level: 1, title: '견습 배심원',  minExp: 0,    maxExp: 99,   color: 'text-zinc-400',   badge: 'bg-zinc-700/60 text-zinc-300' },
  { level: 2, title: '초보 배심원',  minExp: 100,  maxExp: 299,  color: 'text-green-400',  badge: 'bg-green-900/60 text-green-300' },
  { level: 3, title: '정식 배심원',  minExp: 300,  maxExp: 599,  color: 'text-blue-400',   badge: 'bg-blue-900/60 text-blue-300' },
  { level: 4, title: '숙련 배심원',  minExp: 600,  maxExp: 999,  color: 'text-purple-400', badge: 'bg-purple-900/60 text-purple-300' },
  { level: 5, title: '전문 배심원',  minExp: 1000, maxExp: 1999, color: 'text-yellow-400', badge: 'bg-yellow-900/60 text-yellow-300' },
  { level: 6, title: '수석 배심원',  minExp: 2000, maxExp: null, color: 'text-red-400',    badge: 'bg-red-900/60 text-red-300' },
]

export function getLevelInfo(exp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (exp >= LEVELS[i].minExp) return LEVELS[i]
  }
  return LEVELS[0]
}

export function getExpProgress(exp: number): { current: number; needed: number; pct: number } {
  const info = getLevelInfo(exp)
  if (info.maxExp === null) {
    return { current: exp - info.minExp, needed: 0, pct: 100 }
  }
  const range = info.maxExp - info.minExp + 1
  const current = exp - info.minExp
  return { current, needed: range, pct: Math.round((current / range) * 100) }
}
