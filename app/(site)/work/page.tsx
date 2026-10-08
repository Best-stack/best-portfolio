import type { Metadata } from 'next'

import { WorkGrid } from '@/components/WorkGrid'
import { SiteHeader } from '@/components/SiteHeader'
import { getProjects, getSettings } from '@/lib/content'

export const revalidate = 60
export const metadata: Metadata = { title: 'Work' }

export default async function WorkPage() {
  const [settings, projects] = await Promise.all([getSettings(), getProjects()])
  return (
    <>
      <SiteHeader settings={settings} current="work" />
      <section className="page-top work-grid-wrap">
        <div className="works__head">
          <div className="label">({projects.length} case studies)</div>
          <h1 className="display">
            Selected
            <br />
            works
          </h1>
        </div>
        <WorkGrid projects={projects} />
      </section>
    </>
  )
}
