'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// --- 레이드 데이터셋 ---
const RAIDS = {
  '카멘': ['1관문', '2관문', '3관문', '4관문'],
  '에키드나': ['1관문', '2관문'],
  '베히모스': ['1관문', '2관문'],
  '아브렐슈드': ['1관문', '2관문'],
}

// --- HP 바 크롭 설정 (해상도 비율 기반) ---
const HP_BAR_CONFIG = {
  roiX: 0.3,      // 가로 30% 지점 시작
  roiY: 0.075,    // 세로 7.5% 지점 시작
  roiWidth: 0.4,  // 가로 폭 40%
  roiHeight: 0.05 // 세로 폭 5%
};

export default function AnalyzePage() {
  const router = useRouter()
  
  // Refs: 초기값을 null로 설정하고 정확한 타입을 지정합니다.
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const pipWindowRef = useRef<Window | null>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // 상태 관리
  const [isCapturing, setIsCapturing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false) 
  const [selectedRaid, setSelectedRaid] = useState('카멘')
  const [selectedGate, setSelectedGate] = useState('3관문')
  const [currentHP, setCurrentHP] = useState<number>(0)
  
  const [currentGuide, setCurrentGuide] = useState({
    hpPhase: "분석 대기 중",
    hint: "레이드와 관문을 선택하고 분석을 시작하세요."
  })

  // --- 1. 백엔드 분석 요청 (Stub) ---
  const requestServerAnalysis = async (imageBase64: string) => {
    // TODO: 실제 백엔드 연동 시 fetch 로직 작성
  }

  // --- 2. 프레임 크롭 프로세서 (에러 방어 강화) ---
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = cropCanvasRef.current;

    // video나 canvas가 없으면 실행 중단 (videoRef is not defined 방지)
    if (!video || !canvas || !isAnalyzing || !isCapturing) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // 비디오 데이터가 유효한 상태인지 확인 (HAVE_CURRENT_DATA 이상)
    if (ctx && video.readyState >= 2) {
      const vW = video.videoWidth;
      const vH = video.videoHeight;

      if (vW === 0 || vH === 0) return;

      const sx = vW * HP_BAR_CONFIG.roiX;
      const sy = vH * HP_BAR_CONFIG.roiY;
      const sw = vW * HP_BAR_CONFIG.roiWidth;
      const sh = vH * HP_BAR_CONFIG.roiHeight;

      // 크롭 수행
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL('image/jpeg', 0.7);
      requestServerAnalysis(imageData);
    }
  }, [isAnalyzing, isCapturing]);

  // 분석 루프 설정
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAnalyzing && isCapturing) {
      timer = setInterval(processFrame, 500);
    }
    return () => clearInterval(timer);
  }, [isAnalyzing, isCapturing, processFrame]);

  // --- 3. 화면 캡처 및 PiP 로직 ---
  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'window' } as any,
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCapturing(true)
        stream.getVideoTracks()[0].onended = () => {
          setIsCapturing(false);
          setIsAnalyzing(false);
        }
      }
    } catch (err) {
      console.error("캡처 시작 실패:", err);
    }
  }

  const openGuidePip = async () => {
    if (!('documentPictureInPicture' in window)) return alert("PiP 미지원 브라우저입니다.");
    try {
      // @ts-ignore
      const pipWindow = await window.documentPictureInPicture.requestWindow({ width: 320, height: 220 });
      pipWindowRef.current = pipWindow;
      
      const styleTags = Array.from(document.styleSheets).map(s => {
        const style = document.createElement('style');
        try { style.textContent = Array.from(s.cssRules).map(r => r.cssText).join(''); } catch(e) {}
        return style;
      });
      styleTags.forEach(s => pipWindow.document.head.appendChild(s));
      
      updatePipUI(pipWindow);
      pipWindow.addEventListener('pagehide', () => { pipWindowRef.current = null; });
    } catch (err) { console.error(err) }
  }

  const updatePipUI = (pipWin: Window) => {
    const doc = pipWin.document;
    doc.body.innerHTML = '';
    doc.body.className = "bg-[#0f111a] text-slate-100 font-sans overflow-hidden select-none";
    const root = doc.createElement('div');
    root.className = "p-4 h-full flex flex-col justify-between border-t-2 border-blue-500/50";
    root.innerHTML = `
      <div>
        <div class="flex justify-between items-center mb-1">
          <span class="text-[10px] font-bold text-blue-400 uppercase tracking-widest">LOA DOCTOR GUIDE</span>
          <div class="flex items-center gap-1.5"><div class="w-1.5 h-1.5 ${isAnalyzing ? 'bg-green-500' : 'bg-red-500'} rounded-full animate-pulse"></div><span class="text-[9px] text-slate-500 font-mono">LIVE</span></div>
        </div>
        <h1 class="text-base font-bold text-slate-200">${selectedRaid} <span class="text-slate-500 text-xs font-normal">${selectedGate}</span></h1>
      </div>
      <div class="bg-blue-500/10 rounded-xl border border-blue-500/20 p-3 my-2">
        <div class="text-[9px] text-blue-400 font-semibold mb-1 uppercase tracking-wider">Current Phase</div>
        <div class="text-lg font-bold text-white leading-none">${currentHP > 0 ? currentHP + ' 줄' : '인식 중...'}</div>
      </div>
      <p class="text-sm font-medium leading-snug text-slate-300 break-keep">${currentGuide.hint}</p>
    `;
    doc.body.appendChild(root);
  }

  useEffect(() => {
    if (pipWindowRef.current) updatePipUI(pipWindowRef.current);
  }, [selectedRaid, selectedGate, currentGuide, currentHP, isAnalyzing]);

  return (
    <div className="min-h-screen bg-[#0f111a] text-slate-100 selection:bg-blue-500/30">
      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center bg-[#0f111a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer" onClick={() => router.push('/')}>
          LOA Doctor
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 설정 패널 */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm shadow-xl">
              <h2 className="text-sm font-semibold text-slate-400 mb-6 uppercase tracking-wider">Raid Configuration</h2>
              
              <div className="space-y-4 mb-8">
                <select value={selectedRaid} onChange={(e) => setSelectedRaid(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none">
                  {Object.keys(RAIDS).map(raid => <option key={raid} value={raid}>{raid}</option>)}
                </select>
                <select value={selectedGate} onChange={(e) => setSelectedGate(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none">
                  {RAIDS[selectedRaid as keyof typeof RAIDS].map(gate => <option key={gate} value={gate}>{gate}</option>)}
                </select>
              </div>

              {/* ROI 미리보기 캔버스 */}
              {isCapturing && (
                <div className="mb-6 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">HP Bar ROI Preview</span>
                  <canvas ref={cropCanvasRef} width={400} height={50} className="w-full h-12 bg-black rounded-lg border border-blue-500/30 object-cover" />
                </div>
              )}

              <div className="space-y-3">
                {!isCapturing ? (
                  <button onClick={startCapture} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-blue-600/20">화면 공유 시작</button>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsAnalyzing(!isAnalyzing)} 
                      className={`w-full py-4 rounded-xl font-bold text-sm transition-all active:scale-95 ${isAnalyzing ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-600 text-white'}`}
                    >
                      {isAnalyzing ? "서버 분석 중단" : "서버 분석 시작"}
                    </button>
                    <button onClick={openGuidePip} className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-sm transition-all active:scale-95">OS 공략창(PiP) 실행</button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 프리뷰 패널 */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative aspect-video bg-black/60 rounded-3xl border border-white/10 overflow-hidden shadow-2xl ring-1 ring-white/5">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
              
              {/* ROI 가이드 테두리 Overlay */}
              {isCapturing && (
                <div 
                  className="absolute border-2 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.4)] pointer-events-none z-10"
                  style={{
                    left: `${HP_BAR_CONFIG.roiX * 100}%`,
                    top: `${HP_BAR_CONFIG.roiY * 100}%`,
                    width: `${HP_BAR_CONFIG.roiWidth * 100}%`,
                    height: `${HP_BAR_CONFIG.roiHeight * 100}%`,
                  }}
                >
                  <span className="absolute -top-5 left-0 text-[10px] font-bold text-red-500 bg-black/80 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                    BACKEND ROI
                  </span>
                </div>
              )}

              {isAnalyzing && (
                <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-green-500/50 backdrop-blur-sm z-20">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-mono text-green-500 uppercase tracking-tighter">Server Syncing...</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-600 italic px-4">
              * 붉은 영역이 보스의 체력바 위치와 일치하는지 확인하세요.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}