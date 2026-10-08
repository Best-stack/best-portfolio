import type { Settings } from '@/lib/types'

import { ArrowUpRight } from './icons'

export function SiteHeader({ settings, current }: { settings: Settings; current?: 'work' | 'about' }) {
  return (
    <header className="site-header">
      <a className="brand" href="/">
        {settings.name}
      </a>
      <nav aria-label="Primary">
        <a href="/about" aria-current={current === 'about' ? 'page' : undefined}>
          About
        </a>
        <a href="/work" aria-current={current === 'work' ? 'page' : undefined}>
          Work
        </a>
        {settings.resumeUrl && <a href={settings.resumeUrl}>Resume</a>}
      </nav>
      <a href={settings.calendlyUrl ?? '/about#contact'}>
        Let&apos;s connect <ArrowUpRight />
      </a>
    </header>
  )
}
