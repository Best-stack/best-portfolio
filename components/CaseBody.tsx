import { PortableText, type PortableTextComponents, type PortableTextBlock } from '@portabletext/react'

import { imgSrc } from '@/lib/img'

type RowImage = { _key: string; url?: string; alt?: string; size?: 'full' | 'half' | 'third'; w?: number; h?: number }

function videoEmbedUrl(url: string): { kind: 'iframe' | 'video'; src: string } {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1` }
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}` }
  return { kind: 'video', src: url }
}

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
              src={imgSrc({ url: im.url }, im.size === 'full' || !im.size ? 2400 : 1400)}
              alt={im.alt ?? ''}
              width={im.w}
              height={im.h}
              loading="lazy"
            />
          ) : null,
        )}
      </div>
    ),
    videoEmbed: ({ value }: { value: { url?: string } }) => {
      if (!value.url) return null
      const v = videoEmbedUrl(value.url)
      return (
        <div className="video">
          {v.kind === 'iframe' ? (
            <iframe src={v.src} title="Video" loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen />
          ) : (
            <video src={v.src} controls playsInline preload="metadata" />
          )}
        </div>
      )
    },
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
