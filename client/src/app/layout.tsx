import './globals.css'
import type { ReactNode } from 'react'

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-black text-white">
        {children}
      </body>
    </html>
  )
}