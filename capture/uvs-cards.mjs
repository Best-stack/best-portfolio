// Records the UniVersus card list hover effect (tilt + glare) and the card popup.
import { chromium } from 'playwright'
import fs from 'node:fs'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
fs.mkdirSync('out/raw', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const VIEW = { width: 1440, height: 900 }
const ctx = await browser.newContext({ viewport: VIEW, recordVideo: { dir: 'out/raw', size: VIEW } })
const t0 = Date.now()
const page = await ctx.newPage()
await page.goto('https://uvsgames.com/universus/cards/', { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
for (const t of ['Accept', 'Accept all', 'Close']) await page.getByRole('button', { name: t }).first().click({ timeout: 1500 }).catch(() => {})
const cards = page.locator('.cards-effect .card')
await cards.first().scrollIntoViewIfNeeded()
const b0 = await cards.first().boundingBox()
await page.evaluate((dy) => scrollBy(0, dy), b0.y - 140)
await wait(1500)
const start = (Date.now() - t0) / 1000
const n = Math.min(await cards.count(), 8)
for (let i = 0; i < n; i++) {
  const b = await cards.nth(i).boundingBox()
  if (!b || b.y + b.height > VIEW.height) continue
  // sweep across the card so the tilt and glare follow the mouse
  await page.mouse.move(b.x + b.width * 0.2, b.y + b.height * 0.25, { steps: 12 })
  await page.mouse.move(b.x + b.width * 0.8, b.y + b.height * 0.5, { steps: 25 })
  await page.mouse.move(b.x + b.width * 0.3, b.y + b.height * 0.8, { steps: 25 })
  await wait(250)
}
// open one card
const b = await cards.nth(1).boundingBox()
if (b) {
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 15 })
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2)
  await wait(3500)
}
const v = page.video(); await ctx.close(); await browser.close()
fs.renameSync(await v.path(), 'out/raw/cards-hover.webm')
fs.writeFileSync('out/start.txt', String(start))
