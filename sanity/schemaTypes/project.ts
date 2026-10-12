import { defineArrayMember, defineField, defineType } from 'sanity'

/** Rich case-study body: paragraphs, sub-headings, lists, links, plus image rows, videos and link lists. */
const caseBody = defineField({
  name: 'body',
  title: 'Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Paragraph', value: 'normal' },
        { title: 'Sub-heading', value: 'h3' },
      ],
      lists: [
        { title: 'Bullets', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [{ name: 'href', type: 'url', title: 'URL' }],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'imageRow',
      title: 'Image row',
      fields: [
        defineField({
          name: 'images',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'image',
              options: { hotspot: true },
              fields: [
                defineField({ name: 'alt', type: 'string', title: 'Alt text' }),
                defineField({
                  name: 'size',
                  type: 'string',
                  title: 'Width',
                  initialValue: 'full',
                  options: {
                    list: [
                      { title: 'Full width', value: 'full' },
                      { title: 'Half', value: 'half' },
                      { title: 'Third', value: 'third' },
                      { title: 'Quarter (phone screens)', value: 'quarter' },
                    ],
                    layout: 'radio',
                    direction: 'horizontal',
                  },
                }),
              ],
            }),
          ],
          validation: (r) => r.min(1),
        }),
      ],
      preview: {
        select: { images: 'images', media: 'images.0' },
        prepare: ({ images, media }) => ({
          title: `Image row (${Array.isArray(images) ? images.length : 0})`,
          media,
        }),
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'videoEmbed',
      title: 'Video',
      fields: [
        defineField({
          name: 'file',
          type: 'file',
          title: 'Upload a video',
          description: 'MP4 works best. Use this OR a link below.',
          options: { accept: 'video/mp4,video/webm,video/quicktime' },
        }),
        defineField({ name: 'url', type: 'url', title: 'Or paste a YouTube, Vimeo or .mp4 link' }),
        defineField({
          name: 'autoplay',
          type: 'boolean',
          title: 'Play silently on loop (best for screen recordings)',
          initialValue: true,
        }),
        defineField({
          name: 'layout',
          type: 'string',
          title: 'Size',
          initialValue: 'wide',
          options: {
            list: [
              { title: 'Full width', value: 'wide' },
              { title: 'Narrower (tall / phone recordings)', value: 'narrow' },
            ],
            layout: 'radio',
            direction: 'horizontal',
          },
        }),
        defineField({ name: 'caption', type: 'string' }),
      ],
      validation: (r) =>
        r.custom((v: { file?: { asset?: unknown }; url?: string } | undefined) =>
          v?.file?.asset || v?.url ? true : 'Upload a video or paste a link',
        ),
      preview: {
        select: { title: 'caption', url: 'url' },
        prepare: ({ title, url }) => ({ title: title || 'Video', subtitle: url || 'Uploaded video' }),
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'beforeAfter',
      title: 'Before / after',
      fields: [
        defineField({ name: 'before', type: 'image', title: 'Before', validation: (r) => r.required() }),
        defineField({ name: 'after', type: 'image', title: 'After', validation: (r) => r.required() }),
        defineField({ name: 'beforeLabel', type: 'string', title: 'Before label', initialValue: 'Before' }),
        defineField({ name: 'afterLabel', type: 'string', title: 'After label', initialValue: 'After' }),
        defineField({
          name: 'layout',
          type: 'string',
          title: 'Size',
          initialValue: 'wide',
          options: {
            list: [
              { title: 'Wide (desktop screenshots)', value: 'wide' },
              { title: 'Narrow (phone screenshots)', value: 'narrow' },
            ],
            layout: 'radio',
            direction: 'horizontal',
          },
        }),
        defineField({ name: 'caption', type: 'string' }),
      ],
      preview: {
        select: { title: 'caption', media: 'after' },
        prepare: ({ title, media }) => ({ title: title || 'Before / after', subtitle: 'Drag slider', media }),
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'linkList',
      title: 'Link buttons',
      fields: [
        defineField({
          name: 'links',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'linkItem',
              fields: [
                defineField({ name: 'label', type: 'string' }),
                defineField({ name: 'url', type: 'url' }),
              ],
              preview: { select: { title: 'label', subtitle: 'url' } },
            }),
          ],
        }),
      ],
      preview: { prepare: () => ({ title: 'Link buttons' }) },
    }),
  ],
})

export const caseSection = defineType({
  name: 'caseSection',
  title: 'Section',
  type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (r) => r.required() }),
    caseBody,
  ],
  preview: { select: { title: 'heading' } },
})

export const project = defineType({
  name: 'project',
  title: 'Case study',
  type: 'document',
  groups: [
    { name: 'card', title: 'Card & intro', default: true },
    { name: 'content', title: 'Case study' },
  ],
  orderings: [{ title: 'Manual order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  fields: [
    defineField({ name: 'title', type: 'string', group: 'card', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'card',
      options: { source: 'title', maxLength: 64 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'order', title: 'Order on Work page', type: 'number', group: 'card' }),
    defineField({ name: 'summary', title: 'One-line summary', type: 'text', rows: 2, group: 'card' }),
    defineField({
      name: 'tags',
      type: 'array',
      group: 'card',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'cardVideo',
      title: 'Card video',
      description:
        'Short looping video shown on the work grid (plays silently, on repeat). Best: MP4, 3:2 landscape (e.g. 1500×1000), 6–15 seconds, under 10 MB, no sound. The card image is shown until it loads.',
      type: 'file',
      group: 'card',
      options: { accept: 'video/mp4,video/webm,video/quicktime' },
    }),
    defineField({ name: 'cover', title: 'Card image', type: 'image', group: 'card', options: { hotspot: true } }),
    defineField({ name: 'hero', title: 'Case study hero image', type: 'image', group: 'card', options: { hotspot: true } }),
    defineField({
      name: 'scope',
      title: 'What I did',
      description: 'Short items shown near the top, e.g. "Navigation redesign", "Design system".',
      type: 'array',
      group: 'card',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
    }),
    defineField({ name: 'role', type: 'string', group: 'card' }),
    defineField({ name: 'date', type: 'string', group: 'card' }),
    defineField({ name: 'contributors', type: 'string', group: 'card' }),
    defineField({ name: 'previewUrl', title: 'Live link', type: 'url', group: 'card' }),
    defineField({
      name: 'previewLabel',
      title: 'Live link label',
      description: 'Shown instead of a link when there is no URL (e.g. "Classified").',
      type: 'string',
      group: 'card',
    }),
    defineField({
      name: 'sections',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'caseSection' })],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'tags', media: 'cover' },
    prepare: ({ title, subtitle, media }) => ({
      title,
      subtitle: Array.isArray(subtitle) ? subtitle.join(' · ') : undefined,
      media,
    }),
  },
})
