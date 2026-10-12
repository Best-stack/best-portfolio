'use client'

import { useRef, useState } from 'react'

/** Drag (or use arrow keys) to compare a before and after screenshot. */
export function BeforeAfter({
  before,
  after,
  beforeLabel,
  afterLabel,
  ratio,
}: {
  before: string
  after: string
  beforeLabel: string
  afterLabel: string
  ratio?: number
}) {
  const [pos, setPos] = useState(50)
  const box = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }

  return (
    <div
      ref={box}
      className="ba"
      style={ratio ? { aspectRatio: String(ratio) } : undefined}
      onPointerDown={(e) => {
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        move(e.clientX)
      }}
      onPointerMove={(e) => dragging.current && move(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ba__img" src={after} alt={afterLabel} draggable={false} loading="lazy" />
      <div className="ba__before" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ba__img" src={before} alt={beforeLabel} draggable={false} loading="lazy" />
      </div>
      <span className="ba__tag ba__tag--before">{beforeLabel}</span>
      <span className="ba__tag ba__tag--after">{afterLabel}</span>
      <div className="ba__handle" style={{ left: `${pos}%` }}>
        <button
          type="button"
          role="slider"
          aria-label="Compare before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 5))
            if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 5))
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M7 5 2 10l5 5M13 5l5 5-5 5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
