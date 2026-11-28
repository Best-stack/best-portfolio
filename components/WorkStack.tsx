'use client'

import { useEffect, useRef } from 'react'

import { imgSrc } from '@/lib/img'
import type { ProjectCard } from '@/lib/types'

/**
 * Selected works as full-width cards, one screen tall. Each card sticks to the top of the
 * page and the next one slides over it, while the card underneath shrinks and dims.
 */
export function WorkStack({ projects }: { projects: ProjectCard[] }) {
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const slots = Array.from(list.querySelectorAll<HTMLElement>('.stack-slot'))
    let frame = 0
    const update = () => {
      frame = 0
      const vh = window.innerHeight
      slots.forEach((slot, i) => {
        const next = slots[i + 1]
        const card = slot.firstElementChild as HTMLElement | null
        if (!card) return
        const t = next ? Math.min(1, Math.max(0, 1 - next.getBoundingClientRect().top / vh)) : 0
        card.style.transform = t ? `scale(${1 - 0.08 * t})` : ''
        card.style.filter = t ? `brightness(${1 - 0.55 * t})` : ''
      })
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <ol className="stack-list" ref={listRef}>
      {projects.map((p, i) => (
        <li key={p.slug} className="stack-slot">
          <StackCard project={p} eager={i < 2} />
        </li>
      ))}
    </ol>
  )
}

function StackCard({ project, eager }: { project: ProjectCard; eager: boolean }) {
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

  const poster = imgSrc(project.cover, 1800)
  // The hotspot set in Sanity Studio decides which part of the cover stays in view
  const focus =
    project.cover?.fx != null && project.cover?.fy != null
      ? { objectPosition: `${Math.round(project.cover.fx * 100)}% ${Math.round(project.cover.fy * 100)}%` }
      : undefined

  return (
    <a className="stack-card" href={`/work/${project.slug}`}>
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
            <img src={poster} alt="" loading={eager ? 'eager' : 'lazy'} style={focus} />
          )
        )}
      </div>
      <div className="stack-card__text">
        <div className="stack-card__top">
          <h3 className="stack-card__title">{project.title}</h3>
          {project.summary && <p className="stack-card__summary">{project.summary}</p>}
        </div>
        <div className="stack-card__foot">
          {project.tags.length > 0 && (
            <ul className="stack-card__tags">
              {project.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
          <span className="stack-card__cta">View case study →</span>
        </div>
      </div>
    </a>
  )
}
