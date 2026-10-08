import 'server-only'

import type { PortableTextBlock } from '@portabletext/react'
import { createClient } from 'next-sanity'

import seed from '@/content/seed.json'
import { apiVersion, dataset, isSanityConfigured, projectId } from '@/sanity/env'

import { seedToPortableText, type SeedItem } from './seedPortableText'
import type { About, Home, Img, Project, ProjectCard, Settings } from './types'

/* ------------------------------------------------------------------ */
/* Sanity                                                              */
/* ------------------------------------------------------------------ */

const client = isSanityConfigured ? createClient({ projectId, dataset, apiVersion, useCdn: true }) : null

const REVALIDATE = 60

async function query<T>(groq: string, params: Record<string, unknown> = {}): Promise<T> {
  if (!client) throw new Error('Sanity is not configured')
  return client.fetch<T>(groq, params, { next: { revalidate: REVALIDATE } })
}

const IMG = `{ "url": asset->url, "alt": alt, "w": asset->metadata.dimensions.width, "h": asset->metadata.dimensions.height }`
const CARD = `"slug": slug.current, title, summary, "tags": coalesce(tags, []), "cover": cover${IMG}`

/* ------------------------------------------------------------------ */
/* Local fallback (content/seed.json) — used until Sanity is set up    */
/* ------------------------------------------------------------------ */

const base = seed.imageBase
const seedImg = (src?: string): Img => {
  if (!src) return null
  if (src.startsWith('local:public/')) return { url: '/' + src.slice('local:public/'.length) }
  return { url: base + src }
}
const seedCard = (p: (typeof seed.projects)[number]): ProjectCard => ({
  slug: p.slug,
  title: p.title,
  summary: p.summary,
  tags: p.tags,
  cover: seedImg(p.cover),
})
const seedProject = (p: (typeof seed.projects)[number]): Project => ({
  ...seedCard(p),
  role: p.role,
  date: p.date,
  contributors: p.contributors,
  previewUrl: 'previewUrl' in p ? (p.previewUrl as string) : undefined,
  previewLabel: 'previewLabel' in p ? (p.previewLabel as string) : undefined,
  hero: seedImg(p.hero),
  sections: p.sections.map((s) => ({
    heading: s.heading,
    body: seedToPortableText(s.content as SeedItem[], (src) => ({ url: base + src })) as unknown as PortableTextBlock[],
  })),
})

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export async function getSettings(): Promise<Settings> {
  if (!client) return seed.settings
  const s = await query<Settings | null>(
    `*[_id == "siteSettings"][0]{ name, role, location, seoDescription, calendlyUrl, resumeUrl, "socials": coalesce(socials, []), footerHeadline, footerCtaLabel }`,
  )
  return s ?? seed.settings
}

export async function getHome(): Promise<Home> {
  if (!client) {
    const h = seed.home
    return {
      heroPortrait: seedImg(h.heroPortrait),
      marqueeText: h.marqueeText,
      heroRoles: h.heroRoles,
      aboutStatement: h.aboutStatement,
      aboutBody: h.aboutBody,
      skills: h.skills,
      featured: h.featured.map((slug) => seed.projects.find((p) => p.slug === slug)!).filter(Boolean).map(seedCard),
      philosophy: h.philosophy,
      shots: h.shots.map((s) => ({ title: s.title, kind: s.kind, image: seedImg(s.image) })),
    }
  }
  const h = await query<Home | null>(`*[_id == "homePage"][0]{
    "heroPortrait": heroPortrait${IMG}, marqueeText, "heroRoles": coalesce(heroRoles, []),
    aboutStatement, aboutBody, "skills": coalesce(skills, []),
    "featured": coalesce(featuredProjects[]->{ ${CARD} }, []),
    philosophy, "shots": coalesce(shots[]{ title, kind, "image": image${IMG} }, [])
  }`)
  return h ?? { heroPortrait: null, heroRoles: [], skills: [], featured: [], shots: [] }
}

export async function getProjects(): Promise<ProjectCard[]> {
  if (!client) return seed.projects.map(seedCard)
  return query<ProjectCard[]>(`*[_type == "project" && defined(slug.current)] | order(order asc, _createdAt asc){ ${CARD} }`)
}

export async function getProject(slug: string): Promise<Project | null> {
  if (!client) {
    const p = seed.projects.find((x) => x.slug === slug)
    return p ? seedProject(p) : null
  }
  return query<Project | null>(
    `*[_type == "project" && slug.current == $slug][0]{
      ${CARD}, role, date, contributors, previewUrl, previewLabel, "hero": hero${IMG},
      "sections": coalesce(sections[]{ heading, "body": coalesce(body[]{
        ...,
        _type == "imageRow" => { "images": images[]{ _key, size, alt, "url": asset->url, "w": asset->metadata.dimensions.width, "h": asset->metadata.dimensions.height } }
      }, []) }, [])
    }`,
    { slug },
  )
}

export async function getAbout(): Promise<About> {
  if (!client) return { ...seed.about, image: seedImg(seed.about.image) }
  const a = await query<About | null>(`*[_id == "aboutPage"][0]{
    quote, "image": image${IMG}, intro, "experience": coalesce(experience, []),
    whyHeadline, "why": coalesce(why, []), contactIntro
  }`)
  return a ?? { image: null, experience: [], why: [] }
}
