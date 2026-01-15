'use client'

import { forwardRef } from 'react'

const OCRPreviewCanvas = forwardRef<HTMLCanvasElement>((_, ref) => {
  return (
    <div className="space-y-2 max-w-md">
      <p className="font-semibold text-red-500">OCR 입력 캔버스 (실제 인식 영역)</p>
      <canvas ref={ref} className="border border-red-500 w-full bg-black" />
    </div>
  )
})

OCRPreviewCanvas.displayName = 'OCRPreviewCanvas'
export default OCRPreviewCanvas
