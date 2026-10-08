/**
 * Framer → Sanity migration.
 *
 *   npm run migrate:dry   # check everything, upload nothing
 *   npm run migrate       # upload every image and create all documents
 *
 * Reads content/seed.json (extracted from bestux.framer.website), downloads each image
 * from Framer's CDN, uploads it to Sanity's asset library, then creates/replaces:
 * siteSettings, homePage, aboutPage and one `project` per case study.
 *
 * Safe to re-run: documents use fixed IDs (replaced, never duplicated) and uploaded
 * images are cached in .migration-cache.json so they aren't uploaded twice.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

import { createClient, type SanityDocumentStub } from '@sanity/client'
import { config } from 'dotenv'

import { seedToPortableText, type SeedItem } from '../lib/seedPortableText'

config({ path: '.env.local', quiet: true })
config({ quiet: true })

const DRY = process.argv.includes('--dry-run')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId) fail('NEXT_PUBLIC_SANITY_PROJECT_ID is missing — add it to .env.local')
if (!token && !DRY) fail('SANITY_API_WRITE_TOKEN is missing — create an Editor token at sanity.io/manage → API → Tokens')

const client = createClient({ projectId, dataset, token, apiVersion: '2025-01-01', useCdn: false })
const seed = JSON.parse(readFileSync(resolve('content/seed.json'), 'utf8'))
const BASE: string = seed.imageBase

/* ---------------- image upload ---------------- */

const CACHE_FILE = resolve('.migration-cache.json')
const cache: Record<string, string> = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {}
const cacheKey = (src: string) => `${projectId}/${dataset}/${src}`

function collectImages(): string[] {
  const set = new Set<string>()
  const add = (s?: string) => s && set.add(s)
  add(seed.home.heroPortrait)
  seed.home.shots.forEach((s: { image: string }) => add(s.image))
  add(seed.about.image)
  for (const p of seed.projects) {
    add(p.cover)
    add(p.hero)
    for (const sec of p.sections)
      for (const item of sec.content) if ('img' in item) item.img.forEach((i: { src: string }) => add(i.src))
  }
  return [...set]
}

async function fetchBytes(src: string): Promise<Buffer> {
  if (src.startsWith('local:')) return readFileSync(resolve(src.slice('local:'.length)))
  const url = BASE + src
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return Buffer.from(await res.arrayBuffer())
    } catch (err) {
      if (attempt >= 3) throw new Error(`Download failed for ${url}: ${(err as Error).message}`)
      await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }
}

async function uploadAll(srcs: string[]) {
  const todo = srcs.filter((s) => !cache[cacheKey(s)])
  console.log(`Images: ${srcs.length} total, ${srcs.length - todo.length} already uploaded, ${todo.length} to go`)
  if (DRY) return
  let done = 0
  const failed: string[] = []
  const worker = async () => {
    while (todo.length) {
      const src = todo.shift()!
      try {
        const bytes = await fetchBytes(src)
        const asset = await client.assets.upload('image', bytes, { filename: basename(src) })
        cache[cacheKey(src)] = asset._id
        writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
        process.stdout.write(`  ✓ ${++done}  ${basename(src)}\n`)
      } catch (err) {
        failed.push(src)
        process.stdout.write(`  ✗ ${basename(src)} — ${(err as Error).message}\n`)
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  if (failed.length) fail(`${failed.length} image(s) failed. Re-run "npm run migrate" to retry just those.`)
}

const imageRef = (src?: string, extra: Record<string, unknown> = {}) => {
  if (!src) return undefined
  const id = cache[cacheKey(src)] ?? (DRY ? 'image-dry-run' : undefined)
  if (!id) fail(`No uploaded asset for ${src}`)
  return { _type: 'image', asset: { _type: 'reference', _ref: id }, ...extra }
}

/* ---------------- documents ---------------- */

function buildDocuments(): SanityDocumentStub[] {
  const s = seed.settings
  const h = seed.home
  const a = seed.about
  let k = 0
  const key = () => `m${(++k).toString(36)}`

  const settings = {
    _id: 'siteSettings',
    _type: 'siteSettings',
    name: s.name,
    role: s.role,
    location: s.location,
    seoDescription: s.seoDescription,
    calendlyUrl: s.calendlyUrl,
    resumeUrl: s.resumeUrl,
    socials: s.socials.map((x: object) => ({ _key: key(), _type: 'socialLink', ...x })),
    footerHeadline: s.footerHeadline,
    footerCtaLabel: s.footerCtaLabel,
  }

  const projects = seed.projects.map((p: Record<string, any>, order: number) => ({
    _id: `project-${p.slug}`,
    _type: 'project',
    title: p.title,
    slug: { _type: 'slug', current: p.slug },
    order: order + 1,
    summary: p.summary,
    tags: p.tags,
    cover: imageRef(p.cover),
    hero: imageRef(p.hero),
    role: p.role,
    date: p.date,
    contributors: p.contributors,
    previewUrl: p.previewUrl,
    previewLabel: p.previewLabel,
    sections: p.sections.map((sec: { heading: string; content: SeedItem[] }) => ({
      _key: key(),
      _type: 'caseSection',
      heading: sec.heading,
      body: seedToPortableText(sec.content, (src) => imageRef(src)!),
    })),
  }))

  const home = {
    _id: 'homePage',
    _type: 'homePage',
    heroPortrait: imageRef(h.heroPortrait, { alt: `Portrait of ${s.name}` }),
    marqueeText: h.marqueeText,
    heroRoles: h.heroRoles,
    aboutStatement: h.aboutStatement,
    aboutBody: h.aboutBody,
    skills: h.skills,
    featuredProjects: h.featured.map((slug: string) => ({ _key: key(), _type: 'reference', _ref: `project-${slug}` })),
    philosophy: h.philosophy,
    shots: h.shots.map((x: { title: string; kind: string; image: string }) => ({
      _key: key(),
      _type: 'shot',
      title: x.title,
      kind: x.kind,
      image: imageRef(x.image),
    })),
  }

  const about = {
    _id: 'aboutPage',
    _type: 'aboutPage',
    quote: a.quote,
    image: imageRef(a.image),
    intro: a.intro,
    experience: a.experience.map((x: object) => ({ _key: key(), _type: 'job', ...x })),
    whyHeadline: a.whyHeadline,
    why: a.why.map((x: object) => ({ _key: key(), _type: 'reason', ...x })),
    contactIntro: a.contactIntro,
  }

  return [settings, ...projects, home, about]
}

/* ---------------- run ---------------- */

async function main() {
  console.log(`${DRY ? '[dry run] ' : ''}Migrating to Sanity project ${projectId}, dataset "${dataset}"\n`)
  await uploadAll(collectImages())
  const docs = buildDocuments()
  console.log(`\nDocuments: ${docs.length} (settings, home, about, ${seed.projects.length} case studies)`)
  if (DRY) {
    console.log('\nDry run complete — nothing was written. Run "npm run migrate" to do it for real.')
    return
  }
  const tx = client.transaction()
  docs.forEach((d) => tx.createOrReplace(d as never))
  await tx.commit()
  console.log('\n✓ Done. Open /studio to edit, and the site will pick up changes within a minute.')
}

function fail(msg: string): never {
  console.error(`\n✗ ${msg}\n`)
  process.exit(1)
}

main().catch((err) => fail(err.message ?? String(err)))
