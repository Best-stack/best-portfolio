/**
 * Converts the simple content format in content/seed.json into Sanity Portable Text.
 * Used by the migration script (with uploaded image assets) and by the site's
 * local fallback mode (with plain image URLs) so both render identically.
 */

export type SeedItem =
  | { p: string }
  | { h: string }
  | { ul: string[] }
  | { ol: string[] }
  | { img: { src: string; size: 'full' | 'half' | 'third' | 'quarter' }[] }
  | { video: string | { src?: string; url?: string; caption?: string; layout?: 'wide' | 'narrow'; autoplay?: boolean } }
  | {
      compare: {
        before: string
        after: string
        beforeLabel?: string
        afterLabel?: string
        layout?: 'wide' | 'narrow'
        caption?: string
      }
    }
  | { links: { label: string; url: string }[] }

let counter = 0
export const key = (prefix = 'k') => `${prefix}${(++counter).toString(36)}${Math.random().toString(36).slice(2, 6)}`

const span = (text: string) => ({ _type: 'span', _key: key('s'), text, marks: [] as string[] })

const block = (text: string, style = 'normal', list?: 'bullet' | 'number') => ({
  _type: 'block',
  _key: key('b'),
  style,
  markDefs: [],
  children: [span(text)],
  ...(list ? { listItem: list, level: 1 } : {}),
})

/**
 * @param resolveImage turns a seed image path into the value stored on an image item:
 *   - migration: `{ asset: { _type: 'reference', _ref: assetId } }`
 *   - fallback:  `{ url: 'https://…' }`
 */
export function seedToPortableText(
  items: SeedItem[],
  resolveImage: (src: string) => Record<string, unknown>,
  resolveFile: (src: string) => Record<string, unknown> = () => ({}),
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  for (const item of items) {
    if ('p' in item) out.push(block(item.p))
    else if ('h' in item) out.push(block(item.h, 'h3'))
    else if ('ul' in item) item.ul.forEach((t) => out.push(block(t, 'normal', 'bullet')))
    else if ('ol' in item) item.ol.forEach((t) => out.push(block(t, 'normal', 'number')))
    else if ('img' in item)
      out.push({
        _type: 'imageRow',
        _key: key('r'),
        images: item.img.map((im) => ({ _type: 'image', _key: key('i'), size: im.size, ...resolveImage(im.src) })),
      })
    else if ('video' in item) {
      const v = typeof item.video === 'string' ? { url: item.video, autoplay: false } : item.video
      out.push({
        _type: 'videoEmbed',
        _key: key('v'),
        ...(v.src ? { file: { _type: 'file', ...resolveFile(v.src) } } : {}),
        ...(v.url ? { url: v.url } : {}),
        autoplay: v.autoplay ?? true,
        layout: v.layout ?? 'wide',
        ...(v.caption ? { caption: v.caption } : {}),
      })
    } else if ('compare' in item) {
      const c = item.compare
      out.push({
        _type: 'beforeAfter',
        _key: key('c'),
        before: { _type: 'image', ...resolveImage(c.before) },
        after: { _type: 'image', ...resolveImage(c.after) },
        beforeLabel: c.beforeLabel ?? 'Before',
        afterLabel: c.afterLabel ?? 'After',
        layout: c.layout ?? 'wide',
        ...(c.caption ? { caption: c.caption } : {}),
      })
    }
    else if ('links' in item)
      out.push({
        _type: 'linkList',
        _key: key('l'),
        links: item.links.map((l) => ({ _type: 'linkItem', _key: key('li'), ...l })),
      })
  }
  return out
}
