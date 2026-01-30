import { useEffect, useRef, RefObject } from 'react'
import { Rect } from '../utils/types'

type UseBossLineSearchingProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  rect: Rect | null
  enabled: boolean
  onDetected: (rect?: Rect) => void
  recognize: (image: any) => Promise<any>
  interval?: number
}

// 30x30 Window as requested
const WIN_SIZE = 30
const STEP = 10 
const BATCH_SIZE = 5 // Checking 5 spots per frame (Horizontal Scan is fast)

export function useBossLineSearching({
  videoRef,
  canvasRef,
  rect,
  enabled,
  onDetected,
  recognize,
  interval = 100,
}: UseBossLineSearchingProps) {
  
  const scanCursor = useRef({ x: 0 })
  const bestMatchRef = useRef<{x:number, y:number, conf:number, text:string} | null>(null)
  
  useEffect(() => {
    if (enabled) {
        scanCursor.current = { x: 0 }
        bestMatchRef.current = null
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    if (!videoRef.current || !canvasRef.current || !rect) return

    let stopped = false
    let timeoutId: NodeJS.Timeout
    let loopCount = 0

    const loop = async () => {
        if (stopped) return
        loopCount++

        const video = videoRef.current
        if (!video || !video.videoWidth) {
            timeoutId = setTimeout(loop, interval)
            return
        }

        try {
            // 1. Define ROI
            const prev_sx = video.videoWidth * 0.50
            const prev_sw = video.videoWidth * 0.25
            const prev_sy = video.videoHeight * 0.02
            const prev_sh = video.videoHeight * 0.10

            const mid_sw = prev_sw * 0.5
            const mid_sh = prev_sh * 0.5
            const mid_sx = prev_sx + prev_sw * 0.25
            const mid_sy = prev_sy + prev_sh * 0.25

            const sw = Math.floor(mid_sw)
            const sh = Math.floor(mid_sh * 0.60)
            const sx = Math.floor(mid_sx)
            const sy = Math.floor(mid_sy + mid_sh * 0.20)
            
            // 2. Extract Whole ROI first
            const roiCanvas = document.createElement('canvas')
            roiCanvas.width = sw
            roiCanvas.height = sh
            const ctx = roiCanvas.getContext('2d')
            if (!ctx) throw new Error('No Context')
            
            // Pre-process (Invert/Threshold)
            ctx.filter = 'grayscale(100%) contrast(150%) brightness(120%) invert(100%)' 
            ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh)
            ctx.filter = 'none'

            // Debug View Draw
            const debugCanvas = canvasRef.current
            const dCtx = debugCanvas ? debugCanvas.getContext('2d') : null
            if (debugCanvas && dCtx) {
                debugCanvas.width = sw
                debugCanvas.height = sh
                dCtx.drawImage(roiCanvas, 0, 0)
                
                if (bestMatchRef.current) {
                    const { x, y, conf } = bestMatchRef.current
                    dCtx.strokeStyle = 'red'
                     dCtx.lineWidth = 3
                     dCtx.strokeRect(x, y, WIN_SIZE, WIN_SIZE)
                     dCtx.fillStyle = 'red'
                     dCtx.font = 'bold 16px sans-serif'
                     dCtx.fillText(`X:${conf.toFixed(0)}%`, x, y - 5)
                }
            }

            // 3. Batch Process (Horizontal Center Scan)
            let checks = 0
            const fixedY = Math.floor((sh - WIN_SIZE) / 2) // Fixed Y Center
            
            while (checks < BATCH_SIZE) {
                const cx = scanCursor.current.x
                const cy = fixedY 
                
                // Extract 30x30 Crop
                const cropCvs = document.createElement('canvas')
                cropCvs.width = WIN_SIZE
                cropCvs.height = WIN_SIZE
                const cCtx = cropCvs.getContext('2d')
                
                if (cCtx) {
                    cCtx.drawImage(roiCanvas, cx, cy, WIN_SIZE, WIN_SIZE, 0, 0, WIN_SIZE, WIN_SIZE)
                    
                    // OCR
                    const dataUrl = cropCvs.toDataURL('image/png')
                    const result = await recognize(dataUrl)
                    
                    if (result && result.data) {
                        const text = result.data.text.trim()
                        const conf = result.data.confidence
                        
                        // Check for X
                        if (text.match(/x/i) && conf > 50) {
                             // Precise Alignment using Bounding Box
                             let internalOffset = 0
                             const words = result.data.words || []
                             // Find the word/symbol that is "X"
                             const target = words.find((w: any) => w.text.match(/x/i))
                             
                             if (target && target.bbox) {
                                 internalOffset = target.bbox.x0
                             }
                             
                             // Adjust X to start EXACTLY at the character pixel
                             const preciseX = cx + internalOffset
                             
                             if (!bestMatchRef.current || conf > bestMatchRef.current.conf) {
                                 bestMatchRef.current = { x: preciseX, y: cy, conf, text }
                             }
                        }
                    }
                }
                
                // Visualize Cursor
                if (dCtx) {
                    dCtx.strokeStyle = '#00ffff'
                    dCtx.lineWidth = 1
                    dCtx.strokeRect(cx, cy, WIN_SIZE, WIN_SIZE)
                }

                // Advance Cursor (X only)
                scanCursor.current.x += STEP
                if (scanCursor.current.x > sw - WIN_SIZE) {
                    scanCursor.current.x = 0 // Loop back to start
                }
                checks++
            }
            
            // Check Lock Condition (High Confidence X Found)
            const best = bestMatchRef.current
            // USER REQ: Reset Lock confidence to >= 70%
            if (best && best.conf >= 70) {
                 console.log('[BossSearch] Locked on X:', best)
                 
                 if (dCtx) {
                      // Highlight Match (Shifted to Precise X)
                      dCtx.strokeStyle = '#00ff00'
                      dCtx.lineWidth = 4
                      dCtx.strokeRect(best.x, best.y, WIN_SIZE, WIN_SIZE)
                      dCtx.fillStyle = '#00ff00'
                      dCtx.font = 'bold 20px sans-serif'
                      dCtx.fillText("LOCKED!", best.x, best.y - 20)
                      
                      // Show Enlarged Captured Image
                      // We crop from preciseX, so 'X' should be at the left edge
                      const targetCvs = document.createElement('canvas')
                      targetCvs.width = WIN_SIZE
                      targetCvs.height = WIN_SIZE
                      const tCtx = targetCvs.getContext('2d')
                      if (tCtx) {
                          tCtx.drawImage(roiCanvas, best.x, best.y, WIN_SIZE, WIN_SIZE, 0, 0, WIN_SIZE, WIN_SIZE)
                          
                          const zoom = 3
                          const viewW = WIN_SIZE * zoom
                          const viewH = WIN_SIZE * zoom
                          const viewX = sw - viewW - 10
                          const viewY = 10
                          
                          dCtx.fillStyle = 'black'
                          dCtx.fillRect(viewX - 2, viewY - 15, viewW + 4, viewH + 17)
                          dCtx.drawImage(targetCvs, viewX, viewY, viewW, viewH)
                          
                          // Draw a vertical guide on the preview to show "Left Align"
                          tCtx.strokeStyle = 'red'
                          tCtx.lineWidth = 1
                          tCtx.beginPath(); tCtx.moveTo(0,0); tCtx.lineTo(0, WIN_SIZE); tCtx.stroke();
                          
                          dCtx.fillStyle = 'lime'
                          dCtx.font = '12px sans-serif'
                          dCtx.fillText(`CONF: ${best.conf}%`, viewX, viewY - 4)
                      }
                 }

                 // Calculate Global Coordinates
                 const globalX = sx + best.x
                 const globalY = sy + best.y
                 
                 const newRect: Rect = {
                     x: globalX,
                     y: globalY - 10, 
                     w: 250,          
                     h: 60,           
                     aspect: 'UNKNOWN'
                 }
                 
                 stopped = true
                 // Delay transition for 2 seconds to allow user to inspect the image
                 setTimeout(() => onDetected(newRect), 2000)
                 return
            }
            
            if (dCtx) {
                dCtx.fillStyle = '#00ffff'
                dCtx.font = '12px monospace'
                dCtx.fillText(`ScanX: ${scanCursor.current.x}`, 5, 15)
            }

        } catch (e) { console.error(e) }
        
        timeoutId = setTimeout(loop, interval)
    }

    loop()
    return () => {
      stopped = true
      clearTimeout(timeoutId)
    }
  }, [enabled, rect, interval, videoRef, canvasRef, recognize])
}
