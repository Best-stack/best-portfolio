import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CaseBody } from '@/components/CaseBody'
import { ArrowLeft } from '@/components/icons'
import { MiniCard } from '@/components/ProjectCard'
import { SiteHeader } from '@/components/SiteHeader'
import { getProject, getProjects, getSettings } from '@/lib/content'
import { imgSrc } from '@/lib/img'

export const revalidate = 60

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const projects = await getProjects()
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return {}
  const og = imgSrc(project.cover ?? project.hero, 1200)
  return {
    title: project.title,
    description: project.summary,
    openGraph: og ? { images: [og] } : undefined,
  }
}

export default async function CaseStudyPage({ params }: Params) {
  const { slug } = await params
  const [project, projects, settings] = await Promise.all([getProject(slug), getProjects(), getSettings()])
  if (!project) notFound()

  const index = projects.findIndex((p) => p.slug === slug)
  const prev = projects[(index - 1 + projects.length) % projects.length]
  const next = projects[(index + 1) % projects.length]
  const more = [1, 2, 3].map((n) => projects[(index + n) % projects.length]).filter((p) => p.slug !== slug)

  const meta = [
    ['Role', project.role],
    ['Date', project.date],
    ['Contributors', project.contributors],
  ].filter(([, v]) => v) as [string, string][]

  return (
    <>
      <SiteHeader settings={settings} current="work" />
      <article>
        <header className="case-head wrap">
          <a className="back" href="/work">
            <ArrowLeft /> (All case studies)
          </a>
          <h1>{project.title}</h1>
        </header>

        {project.hero?.url && (
          <div className="wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="case-hero"
              src={imgSrc(project.hero, 2400)}
              alt=""
              width={project.hero.w}
              height={project.hero.h}
            />
          </div>
        )}

        <section className="case-intro wrap">
          {project.summary && <h2>{project.summary}</h2>}
          <dl className="meta">
            {meta.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            {(project.previewUrl || project.previewLabel) && (
              <div>
                <dt>Preview</dt>
                <dd>
                  {project.previewUrl ? (
                    <a href={project.previewUrl} target="_blank" rel="noreferrer">
                      {project.previewUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                    </a>
                  ) : (
                    project.previewLabel
                  )}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <div className="case-body wrap">
          {project.sections.map((s, i) => (
            <section key={`${s.heading}-${i}`} className="case-section">
              <div className="case-section__head">
                <div className="lbl">({String(i + 1).padStart(2, '0')})</div>
                <h2>{s.heading}</h2>
              </div>
              <CaseBody value={s.body} />
            </section>
          ))}
        </div>

        <div className="wrap">
          {projects.length > 1 && (
            <nav className="prevnext" aria-label="More case studies">
              <a href={`/work/${prev.slug}`}>
                <small>Previous</small>
                {prev.title}
              </a>
              <a href={`/work/${next.slug}`}>
                <small>Next</small>
                {next.title}
              </a>
            </nav>
          )}
          {more.length > 0 && (
            <section className="more">
              <h2>
                More work
                <br />
                this way
              </h2>
              <div className="more__grid">
                {more.map((p) => (
                  <MiniCard key={p.slug} project={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </>
  )
}
