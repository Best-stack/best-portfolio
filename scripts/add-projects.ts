/**
 * Adds the case studies in content/new-projects.json to Sanity — without touching anything else.
 *
 *   npm run add-projects:dry   # check, write nothing
 *   npm run add-projects       # upload media and create the new case studies
 *
 * - Uploads every image/video referenced in the file (from content/media/).
 * - Creates each case study only if it doesn't exist yet, so edits you make in the
 *   Studio are never overwritten. Pass --force to replace them anyway.
 * - Puts the new case studies first on the Work page and shifts the existing ones after them
 *   (only their order number changes).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

import { createClient } from '@sanity/client'
import { config } from 'dotenv'

import { seedToPortableText, type SeedItem } from '../lib/seedPortableText'

config({ path: '.env.local', quiet: true })
config({ quiet: true })

const DRY = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId) fail('NEXT_PUBLIC_SANITY_PROJECT_ID is missing')
if (!token && !DRY) fail('SANITY_API_WRITE_TOKEN is missing')

const client = createClient({ projectId, dataset, token, apiVersion: '2025-01-01', useCdn: false })

type NewProject = {
  slug: string
  title: string
  summary: string
  tags: string[]
  scope: string[]
  role: string
  date: string
  contributors?: string
  previewUrl?: string
  cover: string
  hero: string
  cardVideo?: string
  sections: { heading: string; content: SeedItem[] }[]
}
const data: { mediaBase: string; projects: NewProject[] } = JSON.parse(readFileSync(resolve('content/new-projects.json'), 'utf8'))

/* ---------------- media ---------------- */

const CACHE_FILE = resolve('.migration-cache.json')
const cache: Record<string, string> = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {}
const cacheKey = (src: string) => `${projectId}/${dataset}/media:${src}`
const isVideo = (src: string) => /\.(mp4|webm|mov)$/i.test(src)

function collect(): string[] {
  const set = new Set<string>()
  for (const p of data.projects) {
    set.add(p.cover)
    set.add(p.hero)
    if (p.cardVideo) set.add(p.cardVideo)
    for (const s of p.sections)
      for (const item of s.content) {
        if ('img' in item) item.img.forEach((i) => set.add(i.src))
        if ('compare' in item) {
          set.add(item.compare.before)
          set.add(item.compare.after)
        }
        if ('video' in item && typeof item.video === 'object' && item.video.src) set.add(item.video.src)
      }
  }
  return [...set]
}

async function uploadAll(srcs: string[]) {
  const missing = srcs.filter((s) => !existsSync(resolve(data.mediaBase, s)))
  if (missing.length) fail(`Missing media files:\n  ${missing.join('\n  ')}`)
  const todo = srcs.filter((s) => !cache[cacheKey(s)])
  console.log(`Media: ${srcs.length} files, ${srcs.length - todo.length} already uploaded, ${todo.length} to upload`)
  if (DRY) return
  for (const src of todo) {
    const bytes = readFileSync(resolve(data.mediaBase, src))
    const asset = await client.assets.upload(isVideo(src) ? 'file' : 'image', bytes, {
      filename: `${src.replace(/\//g, '-')}`,
      contentType: isVideo(src) ? 'video/mp4' : 'image/jpeg',
    })
    cache[cacheKey(src)] = asset._id
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
    console.log(`  ✓ ${src}`)
  }
}

const ref = (src: string) => {
  const id = cache[cacheKey(src)] ?? (DRY ? 'dry-run' : undefined)
  if (!id) fail(`No uploaded asset for ${src}`)
  return { asset: { _type: 'reference', _ref: id } }
}

/* ---------------- documents ---------------- */

async function main() {
  console.log(`${DRY ? '[dry run] ' : ''}Adding ${data.projects.length} case studies to ${projectId}/${dataset}\n`)

  const existing = await client.fetch<{ _id: string; slug: string; order?: number }[]>(
    `*[_type == "project" && !(_id in path("drafts.**"))]{ _id, "slug": slug.current, order } | order(order asc)`,
  )
  const newIds = new Set(data.projects.map((p) => `project-${p.slug}`))
  const present = new Set(existing.map((e) => e._id))

  await uploadAll(collect())

  let k = 0
  const key = () => `n${(++k).toString(36)}`
  const tx = client.transaction()
  let created = 0

  data.projects.forEach((p, i) => {
    const _id = `project-${p.slug}`
    if (present.has(_id) && !FORCE) {
      console.log(`  • ${p.title} already exists — skipped (use --force to replace)`)
      return
    }
    created++
    tx.createOrReplace({
      _id,
      _type: 'project',
      title: p.title,
      slug: { _type: 'slug', current: p.slug },
      order: i + 1,
      summary: p.summary,
      tags: p.tags,
      scope: p.scope,
      role: p.role,
      date: p.date,
      contributors: p.contributors,
      previewUrl: p.previewUrl,
      cover: { _type: 'image', ...ref(p.cover) },
      hero: { _type: 'image', ...ref(p.hero) },
      ...(p.cardVideo ? { cardVideo: { _type: 'file', ...ref(p.cardVideo) } } : {}),
      sections: p.sections.map((s) => ({
        _key: key(),
        _type: 'caseSection',
        heading: s.heading,
        body: seedToPortableText(s.content, (src) => ref(src), (src) => ref(src)),
      })),
    })
  })

  // Existing case studies go after the new ones (only `order` is changed)
  const others = existing.filter((e) => !newIds.has(e._id))
  others.forEach((e, i) => {
    const order = data.projects.length + i + 1
    if (e.order !== order) tx.patch(e._id, (patch) => patch.set({ order }))
  })

  console.log(`\nCreating ${created} case studies, re-ordering ${others.length} existing ones`)
  if (DRY) return console.log('\nDry run complete — nothing was written.')
  await tx.commit()
  console.log('\n✓ Done. New case studies are live within a minute.')
}

function fail(msg: string): never {
  console.error(`\n✗ ${msg}\n`)
  process.exit(1)
}

main().catch((err) => fail(err.message ?? String(err)))
