import { defineArrayMember, defineField, defineType } from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero', default: true },
    { name: 'about', title: 'About' },
    { name: 'work', title: 'Work' },
    { name: 'extras', title: 'Philosophy & shots' },
  ],
  fields: [
    defineField({
      name: 'heroPortrait',
      title: 'Hero portrait',
      description: 'Black & white portrait on a #DBDBDB background works best — it blends into the hero.',
      type: 'image',
      group: 'hero',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string', title: 'Alt text' })],
    }),
    defineField({ name: 'marqueeText', title: 'Scrolling name', type: 'string', group: 'hero' }),
    defineField({
      name: 'heroRoles',
      title: 'Hero lines (bottom right)',
      type: 'array',
      group: 'hero',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({ name: 'aboutStatement', title: 'About statement', type: 'text', rows: 3, group: 'about' }),
    defineField({ name: 'aboutBody', title: 'About body', type: 'text', rows: 3, group: 'about' }),
    defineField({
      name: 'skills',
      title: 'Skills',
      type: 'array',
      group: 'about',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'featuredProjects',
      title: 'Featured projects',
      description: 'Not used any more — the home page now shows every case study, in the order set on each one.',
      hidden: true,
      type: 'array',
      group: 'work',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'project' }] })],
    }),
    defineField({ name: 'philosophy', title: 'Philosophy quote', type: 'text', rows: 2, group: 'extras' }),
    defineField({
      name: 'shots',
      title: 'Shots',
      type: 'array',
      group: 'extras',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'shot',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'kind', title: 'Label', type: 'string' }),
            defineField({ name: 'image', type: 'image', title: 'Image or GIF', options: { hotspot: true } }),
          ],
          preview: { select: { title: 'title', subtitle: 'kind', media: 'image' } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Home page' }) },
})
