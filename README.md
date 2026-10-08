# Best Omotayo — Portfolio

Next.js 16 site with an embedded Sanity Studio. All content (pages, case studies, images) is editable at `/studio`.

```
app/(site)/          Home, Work, Case study, About pages
app/studio/          Sanity Studio (yoursite.com/studio)
components/          Hero (grid-distortion effect), cards, case-study renderer, header, footer
sanity/schemaTypes/  Content model
content/seed.json    Everything extracted from bestux.framer.website
scripts/migrate.ts   Loads seed.json + all images into Sanity
```

Until Sanity is connected, the site renders straight from `content/seed.json` (images load from Framer's CDN), so you can run it right away.

## 1. Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

## 2. Create the Sanity project

1. Go to https://www.sanity.io/manage → **Create new project** (free plan is plenty). Dataset: `production`.
2. Copy the **Project ID**.
3. **API → CORS origins** → add `http://localhost:3000` (tick *Allow credentials*). Add your live domain later.
4. **API → Tokens** → *Add API token*, permissions **Editor**. Copy it.
5. Create `.env.local` from `.env.example` and paste both values.

## 3. Migrate everything from Framer

```bash
npm run migrate:dry   # checks config, lists what will be created
npm run migrate       # downloads ~90 images from Framer, uploads them, creates all pages
```

It's safe to re-run: pages are replaced (not duplicated) and already-uploaded images are skipped.
Afterwards, restart `npm run dev` and open http://localhost:3000/studio.

## 4. Deploy (Vercel)

1. Push this folder to a GitHub repo, then import it at https://vercel.com/new.
2. Add environment variables `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET`
   (the write token is **not** needed on Vercel).
3. In Sanity → API → CORS origins, add your Vercel/custom domain with credentials allowed.
4. Point your domain at Vercel. Old Framer URLs (`/elysium`, `/case-studies`, `/contact`…) redirect to the new ones.

Published edits appear on the live site within ~60 seconds.

## Editing in the Studio

- **Home page** — hero portrait, scrolling name, about text, featured projects (drag to reorder), philosophy quote, shots.
- **Case studies** — card image, tags, details, and sections. Each section's content mixes text, lists,
  image rows (set each image to Full / Half / Third width), videos (YouTube, Vimeo or .mp4) and link buttons.
- **About page** and **Site settings** (name, links, resume, footer).

## Hero effect

`components/Hero.tsx` — WebGL grid distortion. Tune `gridSize` (columns; higher = smaller blocks) and
`strength` props in `app/(site)/page.tsx`. Portraits look best in black & white on a `#DBDBDB` background.
