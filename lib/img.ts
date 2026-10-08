import type { Img } from './types'

/** Resized image URL for Sanity CDN or Framer CDN images. */
export function imgSrc(img: Img | undefined, width = 1600): string | undefined {
  if (!img?.url) return undefined
  if (img.url.includes('cdn.sanity.io')) return `${img.url}?w=${width}&auto=format&fit=max&q=82`
  if (img.url.includes('framerusercontent.com') && !img.url.endsWith('.gif'))
    return `${img.url}?scale-down-to=${width > 2048 ? 4096 : 2048}`
  return img.url
}
