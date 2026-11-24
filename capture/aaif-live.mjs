import { chromium } from 'playwright'
import fs from 'node:fs'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
fs.mkdirSync('out/raw', { recursive: true })
const b = await chromium.launch({ channel: 'chrome' })
const VIEW = { width: 1440, height: 900 }
const marks = {}
async function rec(name, url, fn) {
  const ctx = await b.newContext({ viewport: VIEW, recordVideo: { dir: 'out/raw/' + name, size: VIEW } })
  const t0 = Date.now(); const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
  await page.getByRole('button', { name: /^ok(ay)?$/i }).first().click({ timeout: 4000 }).catch(() => {})
  await page.getByRole('button', { name: /close/i }).first().click({ timeout: 1500 }).catch(() => {})
  await wait(800)
  try { await fn(page, () => { marks[name] = (Date.now() - t0) / 1000 }) } catch (e) { console.error(name, e.message) }
  const v = page.video(); await ctx.close(); fs.renameSync(await v.path(), 'out/raw/' + name + '.webm')
}
await rec('hero', 'https://aaif.io/', async (page, start) => {
  await page.reload({ waitUntil: 'networkidle' }).catch(() => {})
  await page.getByRole('button', { name: /^ok(ay)?$/i }).first().click({ timeout: 3000 }).catch(() => {})
  await page.evaluate(() => scrollTo(0, 0))
  start(); await page.mouse.move(400, 500)
  await wait(3000)
  for (const [x, y] of [[300, 400], [900, 300], [1150, 450], [700, 600]]) { await page.mouse.move(x, y, { steps: 30 }); await wait(900) }
  await wait(2500)
})
await rec('events', 'https://aaif.io/events/', async (page, start) => {
  const grid = page.getByRole('button', { name: 'Grid view' })
  const bb = await grid.boundingBox()
  await page.evaluate((y) => scrollTo(0, y), (bb?.y ?? 900) - 120)
  await wait(1500); start(); await wait(1200)
  for (const n of ['Calendar view', 'Map view', 'Grid view']) {
    const b2 = await page.getByRole('button', { name: n }).boundingBox()
    await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2, { steps: 20 }); await wait(300)
    await page.mouse.click(b2.x + b2.width / 2, b2.y + b2.height / 2); await wait(3200)
  }
})
fs.writeFileSync('out/marks.json', JSON.stringify(marks))
await b.close()
