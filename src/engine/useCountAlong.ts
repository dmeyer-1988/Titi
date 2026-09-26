import { useEffect, useState } from 'react'
import { sounds } from './audio'

/** Anime le comptage "10, 20, 30… +4" sur une collection, puis appelle onDone. */
export function useCountAlong(n: number, active: boolean, onDone: () => void) {
  const [counted, setCounted] = useState(0)
  const [showUnits, setShowUnits] = useState(false)
  useEffect(() => {
    if (!active) { setCounted(0); setShowUnits(false); return }
    const packs = Math.floor(n / 10), units = n % 10
    const timers: number[] = []
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const stepMs = reduce ? 120 : 380
    for (let i = 1; i <= packs; i++) {
      timers.push(window.setTimeout(() => { setCounted(i); sounds.tick(i) }, i * stepMs))
    }
    let t = (packs + 1) * stepMs
    if (units) {
      timers.push(window.setTimeout(() => { setShowUnits(true); sounds.tick(packs + 4) }, t))
      t += stepMs
    }
    timers.push(window.setTimeout(onDone, t))
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, n])
  return { counted, showUnits }
}
