'use client'

import { useEffect, useRef } from 'react'

import { imgSrc } from '@/lib/img'
import type { ProjectCard } from '@/lib/types'

/**
 * Selected works, styled like the Shots section: rounded media with a caption below.
 * Each tile loops its card video silently while on screen (paused off-screen),
 * with the card image as poster/fallback.
 */
export function WorkGrid({ projects }: { projects: ProjectCard[] }) {
  return (
    <div className="shots__grid">
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
    <a className="work-tile" href={`/work/${project.slug}`}>
      <figure style={{ margin: 0, display: 'contents' }}>
        <div className="work-tile__media">
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
        <figcaption>
          <span>{project.title}</span>
          {project.tags.length > 0 && <span>{project.tags.join(' · ')}</span>}
        </figcaption>
      </figure>
    </a>
  )
}
