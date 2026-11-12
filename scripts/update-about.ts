/**
 * Small, safe content updates to the About page in Sanity (run from the "Update About page" workflow).
 *
 * - Adds "2024 — Present · Lead Visual Web Designer — Anyday Inc." to the top of Experience (once).
 * - Replaces the "No-code enthusiast" point in "Why me" with an "AI tools" point.
 *
 * Re-running it changes nothing that's already been updated.
 */
import { randomUUID } from 'node:crypto'

import { createClient } from '@sanity/client'
import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })
config({ quiet: true })

const DRY = process.argv.includes('--dry-run')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN
if (!projectId || (!token && !DRY)) {
  console.error('✗ Sanity settings are missing')
  process.exit(1)
}
const client = createClient({ projectId, dataset, token, apiVersion: '2025-01-01', useCdn: false })

const NEW_JOB = { years: '2024 — Present', role: 'Lead Visual Web Designer', company: 'Anyday Inc.', location: '' }
const AI_POINT = {
  title: 'AI tools',
  text: 'I use AI tools like Claude, ChatGPT, Midjourney and Figma AI every day to research, explore ideas, prototype and ship faster, while the craft and the decisions stay human.',
}

type Job = { _key: string; years?: string; role?: string; company?: string; location?: string }
type Reason = { _key: string; title?: string; text?: string }

async function main() {
  const about = await client.fetch<{ _id: string; experience?: Job[]; why?: Reason[] } | null>(
    `*[_id == "aboutPage"][0]{ _id, experience, why }`,
  )
  if (!about) throw new Error('About page not found')

  const patch = client.patch('aboutPage')
  let changes = 0

  if (!(about.experience ?? []).some((j) => /anyday/i.test(j.company ?? ''))) {
    patch.setIfMissing({ experience: [] }).insert('before', 'experience[0]', [{ _key: randomUUID().slice(0, 12), _type: 'job', ...NEW_JOB }])
    console.log('  • Adding Anyday to Experience')
    changes++
  } else console.log('  • Anyday already in Experience — skipped')

  const noCode = (about.why ?? []).find((w) => /no.?code/i.test(w.title ?? ''))
  if (noCode) {
    patch.set({ [`why[_key=="${noCode._key}"].title`]: AI_POINT.title, [`why[_key=="${noCode._key}"].text`]: AI_POINT.text })
    console.log('  • Replacing "No-code enthusiast" with "AI tools"')
    changes++
  } else console.log('  • No "No-code" point found — skipped')

  if (!changes || DRY) return console.log(DRY ? '\nDry run — nothing written.' : '\nNothing to change.')
  await patch.commit()
  console.log('\n✓ About page updated.')
}

main().catch((e) => {
  console.error('✗', e.message ?? e)
  process.exit(1)
})
