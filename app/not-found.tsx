import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <div className="text-6xl mb-4">⚖️</div>
      <h2 className="text-2xl font-bold text-yellow-400 mb-2">사건을 찾을 수 없습니다</h2>
      <p className="text-yellow-700 mb-6">해당 사건은 존재하지 않거나 삭제되었습니다.</p>
      <Link href="/" className="btn-gold">← 법정으로 돌아가기</Link>
    </div>
  )
}
