import type { PortableTextBlock } from '@portabletext/react'

export type Img = { url: string; alt?: string; w?: number; h?: number } | null

export type Settings = {
  name: string
  role?: string
  location?: string
  seoDescription?: string
  calendlyUrl?: string
  resumeUrl?: string
  socials: { label: string; url: string }[]
  footerHeadline?: string
  footerCtaLabel?: string
}

export type ProjectCard = {
  slug: string
  title: string
  summary?: string
  tags: string[]
  cover: Img
  /** Looping preview video for the work grid (optional — falls back to the cover image). */
  video?: string | null
}

export type Project = ProjectCard & {
  role?: string
  date?: string
  contributors?: string
  previewUrl?: string
  previewLabel?: string
  hero: Img
  sections: { heading: string; body: PortableTextBlock[] }[]
}

export type Home = {
  heroPortrait: Img
  marqueeText?: string
  heroRoles: string[]
  aboutStatement?: string
  aboutBody?: string
  skills: string[]
  featured: ProjectCard[]
  philosophy?: string
  shots: { title: string; kind?: string; image: Img }[]
}

export type About = {
  quote?: string
  image: Img
  intro?: string
  experience: { years?: string; role?: string; company?: string; location?: string }[]
  whyHeadline?: string
  why: { title?: string; text?: string }[]
  contactIntro?: string
}
