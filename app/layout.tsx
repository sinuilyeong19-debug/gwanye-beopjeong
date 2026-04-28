import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Header } from '@/components/Header'
import { SplashScreen } from '@/components/SplashScreen'

export const metadata: Metadata = {
  title: '관계법정 ⚖️',
  description: 'AI 판사가 당신의 관계 분쟁을 심판합니다. 배심원 투표로 진실을 가리세요.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: '관계법정',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: '관계법정',
    description: '연애·우정·가족 분쟁을 AI 판사에게 맡기세요',
    type: 'website',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-court-pattern">
        <SplashScreen />
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8 pb-20">
          {children}
        </main>
        <footer className="border-t border-yellow-900/20 text-center py-8 text-yellow-900 text-xs">
          ⚖️ 관계법정 — 모든 판결은 오락 목적이며 법적 효력이 없습니다
        </footer>
      </body>
    </html>
  )
}
