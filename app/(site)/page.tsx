import { Hero } from '@/components/Hero'
import { WorkGrid } from '@/components/WorkGrid'
import { getHome, getProjects, getSettings } from '@/lib/content'
import { imgSrc } from '@/lib/img'

export const revalidate = 60

export default async function HomePage() {
  const [home, settings, projects] = await Promise.all([getHome(), getSettings(), getProjects()])

  return (
    <>
      <Hero
        portrait={home.heroPortrait}
        marqueeText={home.marqueeText ?? `${settings.name} –`}
        roles={home.heroRoles.length ? home.heroRoles : [settings.role ?? '', settings.location ?? ''].filter(Boolean)}
        settings={settings}
      />

      <section id="about" className="intro wrap-wide">
        <div className="two-col">
          <div className="label">(About)</div>
          <div className="stack">
            {home.aboutStatement && <p className="intro__statement">{home.aboutStatement}</p>}
            {home.aboutBody && <p className="intro__body">{home.aboutBody}</p>}
            {home.skills.length > 0 && (
              <ul className="chips" aria-label="Skills">
                {home.skills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section id="work" className="shots wrap-wide">
        <div className="shots__head">
          <h2>Selected works</h2>
          <div className="label">({projects.length} case studies)</div>
        </div>
        <WorkGrid projects={projects} />
      </section>

      {home.philosophy && (
        <section className="philosophy">
          <div>
            <div className="label">(Philosophy)</div>
            <blockquote>“{home.philosophy.replace(/^[“"]|[”"]$/g, '')}”</blockquote>
          </div>
        </section>
      )}

      {home.shots.length > 0 && (
        <section className="shots wrap-wide">
          <div className="shots__head">
            <h2>Shots</h2>
            <div className="label">(Motion &amp; explorations)</div>
          </div>
          <div className="shots__grid">
            {home.shots.map((s) => (
              <figure key={s.title}>
                {s.image?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgSrc(s.image, 900)} alt={s.title} loading="lazy" />
                )}
                <figcaption>
                  <span>{s.title}</span>
                  {s.kind && <span>{s.kind}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
