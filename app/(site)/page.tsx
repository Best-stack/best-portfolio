import { Experience } from '@/components/Experience'
import { Hero } from '@/components/Hero'
import { SiteHeader } from '@/components/SiteHeader'
import { WorkStack } from '@/components/WorkStack'
import { getAbout, getHome, getProjects, getSettings } from '@/lib/content'
import { imgSrc } from '@/lib/img'

export const revalidate = 60

export default async function HomePage() {
  const [home, settings, projects, about] = await Promise.all([getHome(), getSettings(), getProjects(), getAbout()])

  return (
    <>
      <SiteHeader settings={settings} />
      <Hero
        portrait={home.heroPortrait}
        marqueeText={home.marqueeText ?? `${settings.name} –`}
        roles={home.heroRoles.length ? home.heroRoles : [settings.role ?? '', settings.location ?? ''].filter(Boolean)}
        settings={settings}
      />

      <section id="about" className="home-sec wrap-wide">
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

      <Experience jobs={about.experience} className="home-sec home-sec--rule wrap-wide" />

      <section id="work" className="home-sec home-sec--rule wrap-wide">
        <div className="two-col">
          <div className="label">
            (Selected works)
            <span className="home-sec__note">
              {projects.length} case studies<span className="stack-hint"> · scroll the cards</span>
            </span>
          </div>
          <div className="home-sec__body">
            <WorkStack projects={projects} />
          </div>
        </div>
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
        <section className="home-sec shots-home wrap-wide">
          <div className="two-col">
          <div className="label">
            (Shots)
            <span className="home-sec__note">Motion &amp; explorations</span>
          </div>
          <div className="shots__grid home-sec__body">
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
          </div>
        </section>
      )}
    </>
  )
}
