import type { About } from '@/lib/types'

/** The Experience list, shared by the homepage and the About page. */
export function Experience({ jobs, className = 'about-block wrap' }: { jobs: About['experience']; className?: string }) {
  if (!jobs.length) return null
  return (
    <section className={className}>
      <div className="two-col">
        <h2 className="lbl label" style={{ margin: 0 }}>
          (Experience)
        </h2>
        <ul className="jobs">
          {jobs.map((j, i) => (
            <li key={i}>
              <span>{j.years}</span>
              <div>
                <strong>{j.role}</strong> — {j.company}
                {j.location ? `, ${j.location}` : ''}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
