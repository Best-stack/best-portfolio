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
      <section className="shots wrap-wide">
        <div className="shots__head">
          <h1>Selected works</h1>
          <div className="label">({projects.length} case studies)</div>
        </div>
        <WorkGrid projects={projects} />
      </section>
    </>
  )
}
