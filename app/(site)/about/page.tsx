import type { Metadata } from 'next'

import { ArrowUpRight } from '@/components/icons'
import { SiteHeader } from '@/components/SiteHeader'
import { getAbout, getSettings } from '@/lib/content'
import { imgSrc } from '@/lib/img'

export const revalidate = 60
export const metadata: Metadata = { title: 'About' }

export default async function AboutPage() {
  const [about, settings] = await Promise.all([getAbout(), getSettings()])
  return (
    <>
      <SiteHeader settings={settings} current="about" />

      <section className="about-head wrap">
        <div className="label" style={{ marginBottom: 24 }}>
          (About)
        </div>
        {about.quote && <h1>“{about.quote.replace(/^[“"]|[”"]$/g, '')}”</h1>}
      </section>

      {about.image?.url && (
        <div className="wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="about-image" src={imgSrc(about.image, 2400)} alt={`Portrait of ${settings.name}`} />
        </div>
      )}

      {about.intro && (
        <section className="about-block wrap">
          <div className="two-col">
            <div className="lbl label">(Intro)</div>
            <p className="about-intro">{about.intro}</p>
          </div>
        </section>
      )}

      {about.experience.length > 0 && (
        <section className="about-block wrap">
          <div className="two-col">
            <h2 className="lbl label" style={{ margin: 0 }}>
              (Experience)
            </h2>
            <ul className="jobs">
              {about.experience.map((j, i) => (
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
      )}

      {about.why.length > 0 && (
        <section className="about-block wrap">
          <div className="two-col">
            <h2 className="lbl label" style={{ margin: 0 }}>
              (Why me)
            </h2>
            <div style={{ flex: '1 1 auto' }}>
              {about.whyHeadline && <p className="why-head">{about.whyHeadline}</p>}
              <div className="why">
                {about.why.map((w, i) => (
                  <div key={i}>
                    <h3>{w.title}</h3>
                    <p>{w.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section id="contact" className="contact-block wrap">
        <div className="two-col">
          <h2 className="lbl label" style={{ margin: 0 }}>
            (Contact)
          </h2>
          <div style={{ flex: '1 1 auto' }}>
            {about.contactIntro && <p>{about.contactIntro}</p>}
            <div className="contact-links">
              {settings.calendlyUrl && (
                <a href={settings.calendlyUrl}>
                  Schedule a call <ArrowUpRight />
                </a>
              )}
              {settings.socials
                .filter((s) => !/calendly/i.test(s.label))
                .map((s) => (
                  <a key={s.url} href={s.url}>
                    {s.label} <ArrowUpRight />
                  </a>
                ))}
              {settings.resumeUrl && (
                <a href={settings.resumeUrl}>
                  Resume <ArrowUpRight />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
