'use client'

import { useEffect, useRef } from 'react'

import { imgSrc } from '@/lib/img'
import type { ProjectCard } from '@/lib/types'

/**
 * Selected works as stacked cards: each card sticks near the top and the next one
 * slides over it while scrolling. On desktop the cards scroll inside their own area,
 * so moving the mouse off it scrolls the page past the section.
 */
export function WorkStack({ projects }: { projects: ProjectCard[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  // The cards only take over the mouse wheel once the section has settled in place
  // under the header; before that (and with the mouse outside it) the page scrolls.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)').matches) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const park = () => parseFloat(getComputedStyle(el).scrollMarginTop) || 0
    const update = () => {
      const offset = el.getBoundingClientRect().top - park()
      el.dataset.active = Math.abs(offset) < 30 ? 'true' : 'false'
      // When scrolling stops with the section almost in place, nudge it into place once.
      clearTimeout(timer)
      timer = setTimeout(() => {
        const o = el.getBoundingClientRect().top - park()
        if (Math.abs(o) >= 2 && o > -160 && o < 90) window.scrollBy({ top: o, behavior: 'smooth' })
      }, 140)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div ref={scrollerRef} className="stack-scroller" tabIndex={0} aria-label="Selected works">
    <ol className="stack-list">
      {projects.map((p, i) => (
        <li key={p.slug} className="stack-slot" style={{ '--i': i } as React.CSSProperties}>
          <StackCard project={p} index={i} eager={i < 2} />
        </li>
      ))}
    </ol>
    </div>
  )
}

function splitTitle(title: string): [string, string] {
  const words = title.split(' ')
  if (words.length < 2) return [title, '']
  return [words[0], words.slice(1).join(' ')]
}

function StackCard({ project, index, eager }: { project: ProjectCard; index: number; eager: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.25 },
    )
    io.observe(video)
    return () => io.disconnect()
  }, [])

  const poster = imgSrc(project.cover, 1400)
  const [lead, trail] = splitTitle(project.title)

  return (
    <a className="stack-card" href={`/work/${project.slug}`}>
      <div className="stack-card__text">
        <div className="stack-card__top">
          <h3 className="stack-card__title">
            <span>{lead}</span> {trail && <span className="stack-card__trail">{trail}</span>}
          </h3>
          <span className="stack-card__no">{String(index + 1).padStart(2, '0')}</span>
        </div>
        <div className="stack-card__foot">
          {project.tags.length > 0 && (
            <ul className="stack-card__tags">
              {project.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          {project.summary && <p className="stack-card__summary">{project.summary}</p>}
          <span className="stack-card__cta">View case study →</span>
        </div>
      </div>
      <div className="stack-card__media">
        {project.video ? (
          <video
            ref={videoRef}
            src={project.video}
            poster={poster}
            muted
            loop
            playsInline
            preload={eager ? 'auto' : 'metadata'}
            aria-hidden="true"
          />
        ) : (
          poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" loading={eager ? 'eager' : 'lazy'} />
          )
        )}
      </div>
    </a>
  )
}
