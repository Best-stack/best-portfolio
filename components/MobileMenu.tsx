'use client'

import { useEffect, useState } from 'react'

import type { Settings } from '@/lib/types'

import { ArrowUpRight } from './icons'

/** Phone-only menu: a full-screen panel whose links rise into place one after another. */
export function MobileMenu({ settings, current }: { settings: Settings; current?: 'work' | 'about' }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open)
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const links: { href: string; label: string; on?: boolean; external?: boolean }[] = [
    { href: '/', label: 'Home', on: !current },
    { href: '/work', label: 'Work', on: current === 'work' },
    { href: '/about', label: 'About', on: current === 'about' },
    ...(settings.resumeUrl ? [{ href: settings.resumeUrl, label: 'Resume', external: true }] : []),
  ]

  return (
    <>
      <button
        type="button"
        className="mm__toggle"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
      >
        Menu
        <span className="mm__bars" aria-hidden="true">
          <i />
          <i />
        </span>
      </button>

      <div id="mobile-menu" className={`mm${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu" hidden={!open}>
        <div className="mm__top">
          <a className="mm__brand" href="/">
            {settings.name}
          </a>
          <button type="button" className="mm__close" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>

        <nav className="mm__links" aria-label="Menu">
          {links.map((l, i) => (
            <a
              key={l.label}
              href={l.href}
              aria-current={l.on ? 'page' : undefined}
              style={{ '--d': `${80 + i * 70}ms` } as React.CSSProperties}
              onClick={() => setOpen(false)}
              {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              <span className="mm__word">{l.label}</span>
              <ArrowUpRight />
            </a>
          ))}
        </nav>

        <div className="mm__foot" style={{ '--d': `${80 + links.length * 70}ms` } as React.CSSProperties}>
          <a className="mm__cta" href={settings.calendlyUrl ?? '/about#contact'}>
            Let&apos;s connect <ArrowUpRight />
          </a>
          {settings.socials.length > 0 && (
            <div className="mm__socials">
              {settings.socials.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
