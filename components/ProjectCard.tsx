import { imgSrc } from '@/lib/img'
import type { ProjectCard as Card } from '@/lib/types'

export function ProjectCard({ project, priority }: { project: Card; priority?: boolean }) {
  return (
    <a className="card" href={`/work/${project.slug}`}>
      {project.cover?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="card__media"
          src={imgSrc(project.cover, 2400)}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
      <div className="card__shade" />
      <div className="card__copy">
        <h3 className="card__title">{project.title}</h3>
        {project.tags.length > 0 && <div className="card__tags">{project.tags.join(' · ')}</div>}
      </div>
    </a>
  )
}

export function MiniCard({ project }: { project: Card }) {
  return (
    <a className="mini" href={`/work/${project.slug}`}>
      {project.cover?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgSrc(project.cover, 1200)} alt="" loading="lazy" />
      )}
      <div className="mini__copy">
        <h3>{project.title}</h3>
        <div>{project.tags.join(' · ')}</div>
      </div>
    </a>
  )
}
