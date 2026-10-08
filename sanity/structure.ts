import type { StructureResolver } from 'sanity/structure'

const singleton = (S: Parameters<StructureResolver>[0], type: string, title: string) =>
  S.listItem().title(title).id(type).child(S.document().schemaType(type).documentId(type).title(title))

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Portfolio')
    .items([
      singleton(S, 'homePage', 'Home page'),
      singleton(S, 'aboutPage', 'About page'),
      S.divider(),
      S.listItem()
        .title('Case studies')
        .schemaType('project')
        .child(S.documentTypeList('project').title('Case studies').defaultOrdering([{ field: 'order', direction: 'asc' }])),
      S.divider(),
      singleton(S, 'siteSettings', 'Site settings'),
    ])
