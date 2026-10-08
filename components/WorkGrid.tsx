'use client'

import { useEffect, useRef } from 'react'

import { imgSrc } from '@/lib/img'
import type { ProjectCard } from '@/lib/types'

/**
 * Tight grid of tiles. Each tile loops its card video silently while on screen
 * (paused off-screen to save battery), with the card image as poster/fallback.
 * Title and tags slide up on hover.
 */
export function WorkGrid({ projects }: { projects: ProjectCard[] }) {
  return (
    <div className="work-grid">
      {projects.map((p, i) => (
        <Tile key={p.slug} project={p} eager={i < 4} />
      ))}
    </div>
  )
}

function Tile({ project, eager }: { project: ProjectCard; eager: boolean }) {
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

  const poster = imgSrc(project.cover, 1200)

  return (
    <a className="tile" href={`/work/${project.slug}`}>
      {project.video ? (
        <video
          ref={videoRef}
          className="tile__media"
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
          <img className="tile__media" src={poster} alt="" loading={eager ? 'eager' : 'lazy'} />
        )
      )}
      <div className="tile__info">
        <h3>{project.title}</h3>
        {project.tags.length > 0 && <p>{project.tags.join(' · ')}</p>}
      </div>
    </a>
  )
}
