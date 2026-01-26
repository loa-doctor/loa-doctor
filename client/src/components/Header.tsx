'use client'

import { useRouter, usePathname } from 'next/navigation'

export const Header = () => {
  const router = useRouter()
  const pathname = usePathname()

  const isHome = pathname === '/'

  return (
    <nav className="border-b border-white/10 px-6 py-4">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-6">
        <div
          className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer whitespace-nowrap"
          onClick={() => router.push('/')}
        >
          {process.env.NEXT_PUBLIC_APP_TITLE}
        </div>

        <div className="flex items-center gap-6 pl-12 text-sm text-slate-300">
          {process.env.NEXT_PUBLIC_APP_ENV === 'local' && (
            <button onClick={() => router.push('/admin')} className="hover:text-white transition">
              Admin
            </button>
          )}
          <button onClick={() => router.push('/analyze')} className="hover:text-white transition">
            Analyze
          </button>

          {/* 나중에 여기 계속 추가 */}
        </div>
        <div className="flex justify-end">
          {!isHome && (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition"
            >
              <span className="text-lg">←</span>
              <span className="hidden sm:inline">뒤로가기</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
