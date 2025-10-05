import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '자율주행 선발대 관제 플랫폼',
  description: '골든타임 확보를 위한 자율주행 선발대 관제 및 정보공유 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
