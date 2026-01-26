'use client'

export const Footer = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-white/5 mt-10">
      <div className="text-center md:text-left">
        <h3 className="font-bold text-slate-200">실시간 화면 분석</h3>

        <p className="text-sm text-slate-500">OpenCV 기반 패턴 감지</p>
      </div>

      <div className="text-center md:text-left">
        <h3 className="font-bold text-slate-200">PiP 모드 지원</h3>

        <p className="text-sm text-slate-500">게임 창 위 가이드 오버레이</p>
      </div>

      <div className="text-center md:text-left">
        <h3 className="font-bold text-slate-200">무설치 웹 서비스</h3>

        <p className="text-sm text-slate-500">브라우저에서 즉시 실행</p>
      </div>
    </section>
  )
}
