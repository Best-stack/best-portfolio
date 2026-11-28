/**
 * One-off content updates in Sanity (run from the "Update content" workflow):
 * - Hero role → "Product & Web Designer"
 * - Experience dates for Aladdin, Delitbee and FirstFounders
 * - Moves the Oxy case study back to draft (unpublished)
 */
import { createClient } from '@sanity/client'
import { config } from 'dotenv'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

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

  const aaif = await client.fetch<{ title?: string; cardTitle?: string } | null>(`*[_id == "project-aaif"][0]{ title, cardTitle }`)
  console.log(`  • AAIF now: ${JSON.stringify(aaif)}`)
  if (aaif && (aaif.title !== 'Linux - Agentic AI Foundation' || aaif.cardTitle !== 'Linux - AAIF'))
    tx.patch('project-aaif', (p) => p.set({ title: 'Linux - Agentic AI Foundation', cardTitle: 'Linux - AAIF' }))

  // FCMB: move the redesigned dashboard after the identified problems and the previous dashboard
  const fcmb = await client.fetch<{ sections?: { _key: string; heading?: string; body?: { _key: string }[] }[] } | null>(`*[_id == "project-fcmb"][0]{ sections }`)
  if (fcmb?.sections) {
    const from = fcmb.sections.find((s) => s._key === 'mz')
    const to = fcmb.sections.find((s) => s._key === 'm10')
    const moving = from?.body?.find((b) => b._key === 'r71ma10')
    if (from && to && moving) {
      from.body = from.body!.filter((b) => b._key !== 'r71ma10')
      to.body = [...(to.body ?? []), moving]
      tx.patch('project-fcmb', (p) => p.set({ sections: fcmb.sections }))
      console.log('  • FCMB: moved the redesigned dashboard after the previous dashboard')
    } else console.log('  • FCMB: already moved — skipped')
  }

  const heirs = await client.fetch<{ _id: string; previewUrl?: string } | null>(`*[_type == "project" && !(_id in path("drafts.**")) && title match "Heirs*"][0]{ _id, previewUrl }`)
  if (heirs && heirs.previewUrl !== 'https://www.heirsinsurancegroup.com/') {
    tx.patch(heirs._id, (p) => p.set({ previewUrl: 'https://www.heirsinsurancegroup.com/' }))
    console.log(`  • Heirs Life link set (${heirs._id})`)
  }

  // New card covers (the image replaces the card video)
  const COVERS: Record<string, string> = {
    'project-uvs-games': 'content/media/covers/uvs.jpg',
    'project-aaif': 'content/media/covers/aaif.jpg',
    'project-aeon': 'content/media/covers/aeon.jpg',
    'project-loop': 'content/media/covers/loop.jpg',
  }
  for (const [id, file] of Object.entries(COVERS)) {
    const buf = readFileSync(file)
    const hash = createHash('sha1').update(buf).digest('hex').slice(0, 12)
    const cur = await client.fetch<{ label?: string; vid?: string } | null>(`*[_id == $id][0]{ "label": cover.asset->label, "vid": cardVideo.asset._ref }`, { id })
    if (cur?.label === `cover-${hash}` && !cur.vid) continue
    if (DRY) { console.log(`  • Would set new cover on ${id}`); continue }
    const asset = await client.assets.upload('image', buf, { filename: file.split('/').pop(), label: `cover-${hash}` })
    tx.patch(id, (p) => p.set({ cover: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } } }).unset(['cardVideo']))
    console.log(`  • New cover on ${id}`)
  }

  const home = await client.fetch<{ _id: string; heroRoles?: string[] } | null>(`*[defined(heroRoles)][0]{ _id, heroRoles }`)
  console.log(`  • Hero roles now: ${JSON.stringify(home?.heroRoles)}`)
  if (home?.heroRoles?.some((r) => /lead product/i.test(r)))
    tx.patch(home._id, (p) => p.set({ heroRoles: home.heroRoles!.map((r) => r.replace(/lead product/i, 'Product')) }))

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
