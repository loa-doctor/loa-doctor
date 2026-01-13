'use client'

import { useEffect, useRef, useState } from 'react'
import { createWorker, Worker, PSM } from 'tesseract.js'

export default function Test() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const workerRef = useRef<Worker | null>(null)

  const [currentLine, setCurrentLine] = useState<number | null>(null)

  // 마지막 확정 줄 수
  const lastLineRef = useRef<number | null>(null)

  /* =============================
   * 화면 공유
   * ============================= */
  const startScreenShare = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 15 },
      audio: false,
    })

    if (videoRef.current) {
      videoRef.current.srcObject = stream
      await videoRef.current.play()
    }
  }

  /* =============================
   * Tesseract Worker 초기화 (1회)
   * ============================= */
  useEffect(() => {
    let mounted = true

    const initWorker = async () => {
      const worker = await createWorker('eng')

      await worker.setParameters({
        tessedit_char_whitelist: 'xX0123456789',
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
      })

      if (mounted) workerRef.current = worker
    }

    initWorker()

    return () => {
      mounted = false
      workerRef.current?.terminate()
    }
  }, [])

  /* =============================
   * 프레임 처리 + OCR
   * ============================= */
  useEffect(() => {
    let interval: NodeJS.Timeout

    const processFrame = async () => {
      if (
        !videoRef.current ||
        !canvasRef.current ||
        !cropCanvasRef.current ||
        !workerRef.current
      ) {
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 비디오 준비 안 됐을 때
      if (video.videoWidth === 0 || video.videoHeight === 0) return

      /* ---------- 전체 프레임 ---------- */
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      /* ---------- 줄 수(x607) 전용 크롭 ---------- */
      const cropX = Math.floor(canvas.width * 0.56)
      const cropY = Math.floor(canvas.height * 0.02)
      const cropW = Math.floor(canvas.width * 0.05)
      const cropH = Math.floor(canvas.height * 0.09)
      if (cropW <= 0 || cropH <= 0) return

      const imageData = ctx.getImageData(cropX, cropY, cropW, cropH)

      const cropCanvas = cropCanvasRef.current
      cropCanvas.width = cropW
      cropCanvas.height = cropH

      const cropCtx = cropCanvas.getContext('2d')
      if (!cropCtx) return
      cropCtx.putImageData(imageData, 0, 0)

      /* ---------- 전처리: 고대비 그레이 ---------- */
      const img = cropCtx.getImageData(0, 0, cropW, cropH)
      const data = img.data

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        const v = Math.min(255, Math.max(0, (gray - 80) * 2))

        data[i] = v
        data[i + 1] = v
        data[i + 2] = v
      }

      cropCtx.putImageData(img, 0, 0)

      /* ---------- 스케일 업 ---------- */
      const scale = 3
      const scaledCanvas = document.createElement('canvas')
      scaledCanvas.width = cropW * scale
      scaledCanvas.height = cropH * scale

      const sctx = scaledCanvas.getContext('2d')!
      sctx.imageSmoothingEnabled = false
      sctx.drawImage(
        cropCanvas,
        0,
        0,
        scaledCanvas.width,
        scaledCanvas.height
      )

      /* ---------- OCR ---------- */
      const {
        data: { text },
      } = await workerRef.current.recognize(scaledCanvas)

      console.log('OCR RAW:', text)

      /* ---------- x607 파싱 ---------- */
      const match = text.replace(/\s/g, '').match(/x(\d{2,4})/i)
      if (!match) return

      const line = Number(match[1])
      if (Number.isNaN(line)) return

      /* =============================
       * 줄 감소만 처리하는 핵심 로직
       * ============================= */

      // 최초 1회 초기화
      if (lastLineRef.current === null) {
        lastLineRef.current = line
        setCurrentLine(line)
        return
      }

      // 줄 수가 감소했을 때만 반응
      if (line < lastLineRef.current) {
        lastLineRef.current = line
        setCurrentLine(line)

        // 👉 여기서 음성 / 공략 트리거 붙이면 됨
        // speechSynthesis.speak(
        //   new SpeechSynthesisUtterance(`${line}줄입니다`)
        // )
      }
    }

    // OCR 주기 (실전 기준)
    interval = setInterval(processFrame, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">LoA Boss Line Tracker</h1>

      <button
        onClick={startScreenShare}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        화면 공유 시작
      </button>

      <video ref={videoRef} className="hidden" />

      <div>
        <p className="font-semibold">전체 프레임</p>
        <canvas ref={canvasRef} className="border w-full max-w-4xl" />
      </div>

      <div>
        <p className="font-semibold">OCR 크롭 영역</p>
        <canvas ref={cropCanvasRef} className="border" />
      </div>

      {currentLine !== null && (
        <div className="text-2xl font-bold text-red-600">
          {currentLine}줄입니다!
        </div>
      )}
    </div>
  )
}
