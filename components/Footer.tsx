import type { ProjectCard, Settings } from '@/lib/types'

import { ArrowUpRight } from './icons'

export function Footer({ settings, projects }: { settings: Settings; projects: ProjectCard[] }) {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__cta">
          <h2>{settings.footerHeadline ?? "I'm just a call away"}</h2>
          {settings.calendlyUrl && (
            <a className="pill pill--light" href={settings.calendlyUrl}>
              {settings.footerCtaLabel ?? 'Schedule a call'} <ArrowUpRight />
            </a>
          )}
        </div>
        <div className="footer__cols">
          <div>
            <h3>Selected projects</h3>
            {projects.slice(0, 4).map((p) => (
              <a key={p.slug} href={`/work/${p.slug}`}>
                {p.title}
              </a>
            ))}
          </div>
          <div>
            <h3>Pages</h3>
            <a href="/">Home</a>
            <a href="/work">Work</a>
            <a href="/about">About</a>
            {settings.resumeUrl && <a href={settings.resumeUrl}>Resume</a>}
          </div>
          <div>
            <h3>Socials</h3>
            {settings.socials.map((s) => (
              <a key={s.url} href={s.url}>
                {s.label}
              </a>
            ))}
          </div>
        </div>
        <div className="footer__legal">
          <span>
            © {new Date().getFullYear()} {settings.name}
          </span>
          <span>Designed &amp; built in Toronto</span>
        </div>
      </div>
    </footer>
  )
}
