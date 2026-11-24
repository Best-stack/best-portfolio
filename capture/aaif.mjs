import { chromium } from 'playwright'
import fs from 'node:fs'
fs.mkdirSync('out', { recursive: true })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await chromium.launch({ channel: 'chrome' })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 })
const page = await ctx.newPage()
const pages = [
  ['before-home', 'https://web.archive.org/web/20251215000000/https://aaif.io/'],
  ['before-projects', 'https://web.archive.org/web/20251215000000/https://aaif.io/projects/'],
  ['before-events', 'https://web.archive.org/web/20251215000000/https://aaif.io/events/'],
  ['after-home', 'https://aaif.io/'],
  ['after-landscape', 'https://aaif.io/landscape/'],
  ['after-events', 'https://aaif.io/events/'],
]
for (const [n, u] of pages) {
  try {
    await page.goto(u, { waitUntil: 'networkidle', timeout: 120000 }).catch(() => {})
    await wait(3000)
    await page.evaluate(() => { document.querySelectorAll('#wm-ipp-base,#wm-ipp,#donato,#wm-toolbar').forEach((e) => e.remove()); document.body.style.marginTop = '0' })
    for (const t of ['Accept', 'Accept all', 'Reject all', 'Close']) await page.getByRole('button', { name: t }).first().click({ timeout: 1000 }).catch(() => {})
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)) } scrollTo(0, 0) })
    await wait(1500)
    await page.screenshot({ path: `out/${n}.png` })
    await page.screenshot({ path: `out/${n}-full.png`, fullPage: true })
    console.log('shot', n, page.url())
  } catch (e) { console.error(n, e.message) }
}
await b.close()
