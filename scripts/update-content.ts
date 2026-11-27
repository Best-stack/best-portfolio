/**
 * One-off content updates in Sanity (run from the "Update content" workflow):
 * - Hero role → "Product & Web Designer"
 * - Experience dates for Aladdin, Delitbee and FirstFounders
 * - Moves the Oxy case study back to draft (unpublished)
 */
import { createClient } from '@sanity/client'
import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })
config({ quiet: true })

const DRY = process.argv.includes('--dry-run')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN
if (!projectId || !token) {
  console.error('✗ Sanity settings are missing')
  process.exit(1)
}
const client = createClient({ projectId, dataset, token, apiVersion: '2025-01-01', useCdn: false, perspective: 'raw' })

type Job = { _key: string; years?: string; role?: string; company?: string; location?: string }

const JOBS: { match: RegExp; set: Partial<Job> }[] = [
  { match: /aladdin/i, set: { years: '2021 — 2023' } },
  { match: /delit/i, set: { years: '2022', role: 'User Experience Designer (Contract)' } },
]
const FIRST_FOUNDERS = { years: '2019 — 2021', role: 'UX Designer', company: 'FirstFounders Inc', location: 'Lagos, Nigeria' }

async function main() {
  const tx = client.transaction()

  const s = await client.fetch<{ role?: string } | null>(`*[_id == "siteSettings"][0]{ role }`)
  console.log(`  • Hero role now: ${s?.role}`)
  if (s?.role !== 'Product & Web Designer') tx.patch('siteSettings', (p) => p.set({ role: 'Product & Web Designer' }))

  const about = await client.fetch<{ experience?: Job[] } | null>(`*[_id == "aboutPage"][0]{ experience }`)
  const jobs = (about?.experience ?? []).map((j) => ({ ...j }))
  console.log('  • Experience now:')
  for (const j of jobs) console.log(`      ${j.years} | ${j.role} | ${j.company} | ${j.location ?? ''}`)
  for (const { match, set } of JOBS) {
    const j = jobs.find((x) => match.test(`${x.company} ${x.role}`))
    if (j) Object.assign(j, set)
  }
  if (!jobs.some((j) => /first\s*founders/i.test(j.company ?? ''))) jobs.push({ _key: 'firstfounders', _type: 'job', ...FIRST_FOUNDERS } as Job)
  const start = (j: Job) => Number((j.years ?? '').match(/\d{4}/)?.[0] ?? 0)
  jobs.sort((x, y) => start(y) - start(x))
  console.log('  • Experience after:')
  for (const j of jobs) console.log(`      ${j.years} | ${j.role} | ${j.company} | ${j.location ?? ''}`)
  tx.patch('aboutPage', (p) => p.set({ experience: jobs }))

  const oxy = await client.fetch<Record<string, unknown> | null>(`*[_id == "project-oxy"][0]`)
  if (oxy) {
    const { _id, _rev, _createdAt, _updatedAt, ...rest } = oxy as Record<string, unknown>
    void _id; void _rev; void _createdAt; void _updatedAt
    tx.createOrReplace({ ...(rest as { _type: string }), _id: 'drafts.project-oxy' })
    tx.delete('project-oxy')
    console.log('  • Moving Oxy to draft')
  } else console.log('  • Oxy already unpublished — skipped')

  if (DRY) return console.log('\nDry run — nothing written.')
  await tx.commit()
  console.log('\n✓ Content updated.')
}

main().catch((e) => {
  console.error('✗', e.message ?? e)
  process.exit(1)
})
