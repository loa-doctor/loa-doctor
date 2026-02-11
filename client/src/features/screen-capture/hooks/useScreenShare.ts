import type { RefObject } from 'react'

export function useScreenShare(videoRef: RefObject<HTMLVideoElement | null>) {
  const start = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          frameRate: 15,
          // @ts-ignore
          displaySurface: 'window', 
        },
        audio: false,
      })

      const video = videoRef.current
      if (!video) return false

      video.srcObject = stream
      await video.play()
      return true
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        console.warn('사용자가 화면 공유를 취소했습니다.')
      } else {
        console.error('화면 공유 시작 실패:', err)
      }
      return false
    }
  }

  const stop = () => {
    const video = videoRef.current
    const stream = video?.srcObject as MediaStream | null

    stream?.getTracks().forEach(track => track.stop())

    if (video) {
      video.pause()
      video.srcObject = null
    }
  }

  return { start, stop }
}
