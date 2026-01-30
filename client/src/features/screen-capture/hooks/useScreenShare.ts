import type { RefObject } from 'react'

export function useScreenShare(videoRef: RefObject<HTMLVideoElement | null>) {
  const start = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { 
        frameRate: 15,
        // @ts-ignore
        displaySurface: 'window', 
      },
      audio: false,
    })

    const video = videoRef.current
    if (!video) return

    video.srcObject = stream
    await video.play()
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
