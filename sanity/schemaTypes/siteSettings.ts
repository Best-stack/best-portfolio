import { defineArrayMember, defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Your name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    defineField({ name: 'location', title: 'Location', type: 'string' }),
    defineField({ name: 'seoDescription', title: 'SEO description', type: 'text', rows: 2 }),
    defineField({ name: 'calendlyUrl', title: 'Calendly link', type: 'url' }),
    defineField({ name: 'resumeUrl', title: 'Resume link', type: 'url' }),
    defineField({
      name: 'socials',
      title: 'Social links',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'url', type: 'url', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'label', subtitle: 'url' } },
        }),
      ],
    }),
    defineField({ name: 'footerHeadline', title: 'Footer headline', type: 'string' }),
    defineField({ name: 'footerCtaLabel', title: 'Footer button label', type: 'string' }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})
