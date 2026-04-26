'use client'

export function ShareButton() {
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert('링크가 복사되었습니다!'))
      .catch(() => {})
  }
  return (
    <button onClick={handleCopy} className="btn-outline text-xs">
      🔗 링크 복사
    </button>
  )
}
