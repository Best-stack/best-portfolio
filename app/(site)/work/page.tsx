import type { Metadata } from 'next'

import { ProjectCard } from '@/components/ProjectCard'
import { SiteHeader } from '@/components/SiteHeader'
import { getProjects, getSettings } from '@/lib/content'

export const revalidate = 60
export const metadata: Metadata = { title: 'Work' }

export default async function WorkPage() {
  const [settings, projects] = await Promise.all([getSettings(), getProjects()])
  return (
    <>
      <SiteHeader settings={settings} current="work" />
      <section className="page-top wrap">
        <div className="works__head">
          <div className="label">({projects.length} case studies)</div>
          <h1 className="display">
            Selected
            <br />
            works
          </h1>
        </div>
        <div className="works__list">
          {projects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} priority={i === 0} />
          ))}
        </div>
      </section>
    </>
  )
}
