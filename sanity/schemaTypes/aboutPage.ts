import { defineArrayMember, defineField, defineType } from 'sanity'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  fields: [
    defineField({ name: 'quote', title: 'Headline quote', type: 'text', rows: 2 }),
    defineField({ name: 'image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'intro', type: 'text', rows: 4 }),
    defineField({
      name: 'experience',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'job',
          fields: [
            defineField({ name: 'years', type: 'string' }),
            defineField({ name: 'role', type: 'string' }),
            defineField({ name: 'company', type: 'string' }),
            defineField({ name: 'location', type: 'string' }),
          ],
          preview: { select: { title: 'role', subtitle: 'company' } },
        }),
      ],
    }),
    defineField({ name: 'whyHeadline', title: 'Why choose me — headline', type: 'string' }),
    defineField({
      name: 'why',
      title: 'Why choose me — points',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'reason',
          fields: [
            defineField({ name: 'title', type: 'string' }),
            defineField({ name: 'text', type: 'text', rows: 3 }),
          ],
        }),
      ],
    }),
    defineField({ name: 'contactIntro', title: 'Contact intro', type: 'text', rows: 3 }),
  ],
  preview: { prepare: () => ({ title: 'About page' }) },
})
