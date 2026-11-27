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
  { match: /delit/i, set: { years: '2022 · Contract' } },
  { match: /first\s*founders/i, set: { years: '2019 — 2021', location: 'Lagos, Nigeria' } },
]

async function main() {
  const tx = client.transaction()

  const s = await client.fetch<{ role?: string } | null>(`*[_id == "siteSettings"][0]{ role }`)
  console.log(`  • Hero role now: ${s?.role}`)
  if (s?.role !== 'Product & Web Designer') tx.patch('siteSettings', (p) => p.set({ role: 'Product & Web Designer' }))

  const about = await client.fetch<{ experience?: Job[] } | null>(`*[_id == "aboutPage"][0]{ experience }`)
  console.log('  • Experience now:')
  for (const j of about?.experience ?? []) console.log(`      ${j.years} | ${j.role} | ${j.company} | ${j.location ?? ''}`)
  for (const { match, set } of JOBS) {
    const j = (about?.experience ?? []).find((x) => match.test(`${x.company} ${x.role}`))
    if (!j) {
      console.log(`  • No job matching ${match} — skipped`)
      continue
    }
    const fields = Object.fromEntries(Object.entries(set).map(([k, v]) => [`experience[_key=="${j._key}"].${k}`, v]))
    tx.patch('aboutPage', (p) => p.set(fields))
    console.log(`  • ${j.company}: ${JSON.stringify(set)}`)
  }

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
