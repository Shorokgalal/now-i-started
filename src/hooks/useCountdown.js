import { useCallback, useEffect, useRef, useState } from "react"

export default function useCountdown(initialSec, onDone) {
  const [left, setLeft] = useState(initialSec)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const ref = useRef(null)

  const tick = useCallback(() => {
    setLeft(prev => {
      if (!ref.current) return prev
      if (prev <= 0) {
        clearInterval(ref.current)
        ref.current = null
        setRunning(false)
        onDone && onDone()
        return 0
      }
      return prev - 1
    })
  }, [onDone])

  const start = useCallback((sec) => {
    if (typeof sec === "number") setLeft(sec)
    if (ref.current) clearInterval(ref.current)
    ref.current = setInterval(tick, 1000)
    setRunning(true); setPaused(false)
  }, [tick])

  const pause = useCallback(() => {
    if (ref.current) { clearInterval(ref.current); ref.current = null }
    setPaused(true); setRunning(false)
  }, [])

  const resume = useCallback(() => {
    if (!ref.current) {
      ref.current = setInterval(tick, 1000)
      setRunning(true); setPaused(false)
    }
  }, [tick])

  const stop = useCallback(() => {
    if (ref.current) { clearInterval(ref.current); ref.current = null }
    setRunning(false); setPaused(false)
  }, [])

  useEffect(() => () => { if (ref.current) clearInterval(ref.current) }, [])

  return { left, setLeft, running, paused, start, pause, resume, stop }
}
