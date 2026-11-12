'use client'

import { useEffect, useRef } from 'react'

import { imgSrc } from '@/lib/img'
import type { ProjectCard } from '@/lib/types'

/**
 * Selected works as stacked cards: each card sticks near the top of the
 * screen and the next one slides over it while scrolling.
 */
export function WorkStack({ projects }: { projects: ProjectCard[] }) {
  return (
    <ol className="stack-list">
      {projects.map((p, i) => (
        <li key={p.slug} className="stack-slot" style={{ '--i': i } as React.CSSProperties}>
          <StackCard project={p} index={i} eager={i < 2} />
        </li>
      ))}
    </ol>
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
