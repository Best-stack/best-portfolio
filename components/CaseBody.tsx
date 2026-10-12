import { PortableText, type PortableTextComponents, type PortableTextBlock } from '@portabletext/react'

import { imgSrc } from '@/lib/img'
import type { Img } from '@/lib/types'

import { BeforeAfter } from './BeforeAfter'
import { LoopVideo } from './LoopVideo'

type RowImage = {
  _key: string
  url?: string
  alt?: string
  size?: 'full' | 'half' | 'third' | 'quarter'
  w?: number
  h?: number
}

function videoEmbedUrl(url: string): { kind: 'iframe' | 'video'; src: string } {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1` }
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}` }
  return { kind: 'video', src: url }
}

const widthFor = (size?: RowImage['size']) => (size === 'full' || !size ? 2400 : size === 'half' ? 1400 : 900)

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
    h3: ({ children }) => <h3>{children}</h3>,
  },
  list: {
    bullet: ({ children }) => <ul>{children}</ul>,
    number: ({ children }) => <ol>{children}</ol>,
  },
  marks: {
    link: ({ value, children }) => (
      <a href={value?.href} target="_blank" rel="noreferrer">
        {children}
      </a>
    ),
  },
  types: {
    imageRow: ({ value }: { value: { images?: RowImage[] } }) => (
      <div className="img-row">
        {(value.images ?? []).map((im) =>
          im.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={im._key}
              className={im.size ?? 'full'}
              src={imgSrc({ url: im.url }, widthFor(im.size))}
              alt={im.alt ?? ''}
              width={im.w}
              height={im.h}
              loading="lazy"
            />
          ) : null,
        )}
      </div>
    ),
    videoEmbed: ({
      value,
    }: {
      value: { url?: string; fileUrl?: string; autoplay?: boolean; caption?: string; layout?: string }
    }) => {
      const src = value.fileUrl || value.url
      if (!src) return null
      const v = videoEmbedUrl(src)
      return (
        <figure className={`media-figure ${value.layout === 'narrow' ? 'is-medium' : ''}`}>
          {v.kind === 'iframe' ? (
            <div className="video">
              <iframe src={v.src} title={value.caption || 'Video'} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen />
            </div>
          ) : value.autoplay !== false ? (
            <LoopVideo src={v.src} label={value.caption} />
          ) : (
            <div className="video">
              <video src={v.src} controls playsInline preload="metadata" />
            </div>
          )}
          {value.caption && <figcaption>{value.caption}</figcaption>}
        </figure>
      )
    },
    beforeAfter: ({
      value,
    }: {
      value: { before?: Img; after?: Img; beforeLabel?: string; afterLabel?: string; layout?: string; caption?: string }
    }) =>
      value.before?.url && value.after?.url ? (
        <figure className={`media-figure ${value.layout === 'narrow' ? 'is-narrow' : ''}`}>
          <BeforeAfter
            before={imgSrc(value.before, 2400)!}
            after={imgSrc(value.after, 2400)!}
            beforeLabel={value.beforeLabel || 'Before'}
            afterLabel={value.afterLabel || 'After'}
            ratio={value.after.w && value.after.h ? value.after.w / value.after.h : undefined}
          />
          {value.caption && <figcaption>{value.caption}</figcaption>}
        </figure>
      ) : null,
    linkList: ({ value }: { value: { links?: { _key: string; label?: string; url?: string }[] } }) => (
      <div className="link-list">
        {(value.links ?? []).map((l) => (
          <a key={l._key} href={l.url} target="_blank" rel="noreferrer">
            {l.label}
          </a>
        ))}
      </div>
    ),
  },
}

export function CaseBody({ value }: { value: PortableTextBlock[] }) {
  return (
    <div className="prose">
      <PortableText value={value} components={components} />
    </div>
  )
}
