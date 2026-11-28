'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type Testimonial = {
  quote: string
  /** The end of the quote, shown in the second colour */
  highlight: string
  name: string
  role: string
  avatar: string
}

/** One quote at a time; the letters fade up into place, and the avatars switch between quotes. */
export function Testimonials({ items }: { items: Testimonial[] }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const go = useCallback((i: number) => setActive((i + items.length) % items.length), [items.length])

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timer.current = setInterval(() => setActive((a) => (a + 1) % items.length), 9000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [paused, items.length, active])

  const t = items[active]
  let n = 0
  const letters = (text: string, cls?: string) =>
    text.split(/(\s+)/).map((word, wi) =>
      /^\s+$/.test(word) ? (
        word
      ) : (
        <span key={`${cls}-${wi}`} className={`tm__word ${cls ?? ''}`}>
          {Array.from(word).map((ch, ci) => (
            <span key={ci} className="tm__ch" style={{ animationDelay: `${n++ * 14}ms` }}>
              {ch}
            </span>
          ))}
        </span>
      ),
    )

  return (
    <div className="tm" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="tm__body">
        <div className="tm__count" aria-hidden="true">
          <span>{String(active + 1).padStart(2, '0')}</span>/{String(items.length).padStart(2, '0')}
        </div>
        <blockquote className="tm__quote" key={active} aria-live="polite">
          <span className="sr-only">
            “{t.quote} {t.highlight}”
          </span>
          <span aria-hidden="true">
            {letters(`“${t.quote}`)} {letters(`${t.highlight}”`, 'tm__hl')}
          </span>
        </blockquote>
        <div className="tm__who" key={`w${active}`}>
          <strong>{t.name}</strong>
          <span>{t.role}</span>
        </div>
      </div>
      <div className="tm__people" role="tablist" aria-label="Testimonials">
        {items.map((p, i) => (
          <button
            key={p.name}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={p.name}
            className={i === active ? 'is-on' : ''}
            onClick={() => go(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.avatar} alt="" width={64} height={64} />
          </button>
        ))}
      </div>
    </div>
  )
}
