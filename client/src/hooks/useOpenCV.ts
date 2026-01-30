import { useState, useEffect } from 'react'

declare global {
  interface Window {
    cv: any
    onOpenCvReady: () => void
  }
}

export const useOpenCV = () => {
  const [loaded, setLoaded] = useState(false)
  const [cv, setCv] = useState<any>(null)

  useEffect(() => {
    // If already loaded
    if (window.cv && window.cv.Mat) {
      setLoaded(true)
      setCv(window.cv)
      return
    }

    // Wait for script to load (via onOpenCvReady mechanism or polling)
    const checkCv = setInterval(() => {
      if (window.cv && window.cv.Mat) {
        clearInterval(checkCv)
        setLoaded(true)
        setCv(window.cv)
      }
    }, 100)
    
    return () => clearInterval(checkCv)
  }, [])

  return { loaded, cv }
}
