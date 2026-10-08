import { Footer } from '@/components/Footer'
import { getProjects, getSettings } from '@/lib/content'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, projects] = await Promise.all([getSettings(), getProjects()])
  return (
    <>
      <main>{children}</main>
      <Footer settings={settings} projects={projects} />
    </>
  )
}
