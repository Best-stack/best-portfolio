'use client'

import { useEffect, useRef } from 'react'

/** Silent, looping screen recording that only plays while on screen. */
export function LoopVideo({ src, label }: { src: string; label?: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), {
      threshold: 0.2,
    })
    io.observe(v)
    return () => io.disconnect()
  }, [])

  return (
    <video
      ref={ref}
      className="loop-video"
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      controls={false}
      aria-label={label}
    />
  )
}
