import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import './globals.css'
import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-black text-white">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
