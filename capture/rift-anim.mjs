// Records the animated Riftbound OP prototype (desktop + phone).
import { chromium, devices } from 'playwright'
import fs from 'node:fs'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
fs.mkdirSync('out/raw', { recursive: true })
const FILE = 'file://' + process.cwd() + '/riftbound-op-animated.html'
const browser = await chromium.launch({ channel: 'chrome' })
const smooth = (page, by, ms) => page.evaluate(async ([by, ms]) => {
  const s = scrollY, t0 = performance.now()
  await new Promise((res) => { const st = (n) => { const k = Math.min(1, (n - t0) / ms); scrollTo(0, s + by * (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2)); k < 1 ? requestAnimationFrame(st) : res() }; requestAnimationFrame(st) })
}, [by, ms])
async function hover(page, sel, i = 0, sweep = false) {
  const b = await page.locator(sel).nth(i).boundingBox(); if (!b) return
  if (b.y < 60 || b.y + b.height > page.viewportSize().height) { await smooth(page, b.y - 140, 900); await wait(500) }
  const c = await page.locator(sel).nth(i).boundingBox()
  await page.mouse.move(c.x + c.width * 0.3, c.y + c.height * 0.4, { steps: 18 })
  if (sweep) { await page.mouse.move(c.x + c.width * 0.8, c.y + c.height * 0.3, { steps: 30 }); await page.mouse.move(c.x + c.width * 0.6, c.y + c.height * 0.8, { steps: 30 }) }
  await wait(1600)
}
const marks = {}
async function rec(name, opts, fn) {
  const ctx = await browser.newContext({ ...opts, recordVideo: { dir: 'out/raw/' + name, size: opts.viewport } })
  const t0 = Date.now(); const page = await ctx.newPage()
  await page.goto(FILE, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
  await page.evaluate(() => document.fonts.ready)
  await page.reload({ waitUntil: 'networkidle' }).catch(() => {})
  marks[name] = (Date.now() - t0) / 1000
  try { await fn(page) } catch (e) { console.error(name, e.message) }
  const v = page.video(); await ctx.close()
  fs.renameSync(await v.path(), 'out/raw/' + name + '.webm')
}
await rec('desktop', { viewport: { width: 1440, height: 900 } }, async (page) => {
  await page.mouse.move(1300, 300); await wait(3500)
  await smooth(page, 700, 1600); await wait(1800)
  await hover(page, '.next .js-stack')
  await page.mouse.move(1380, 860, { steps: 10 })
  await smooth(page, 800, 1600); await wait(1600)
  await hover(page, '.na .js-stack')
  await page.mouse.move(1380, 860, { steps: 10 })
  await smooth(page, 750, 1500); await wait(1200)
  await hover(page, '.tilt .card', 0, true)
  await hover(page, '.tilt .card', 1, true)
  await page.mouse.move(1380, 880, { steps: 10 })
  const top = await page.evaluate(() => document.getElementById('prev').getBoundingClientRect().top + scrollY)
  await smooth(page, top - (await page.evaluate(() => scrollY)), 1400); await wait(1200)
  for (let i = 0; i < 8; i++) { await smooth(page, 260, 700); await wait(150) }
  await hover(page, '.rcard', 6); await wait(600)
})
await rec('mobile', { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } }, async (page) => {
  await wait(3500)
  for (let i = 0; i < 14; i++) { await smooth(page, 560, 1300); await wait(700) }
})
fs.writeFileSync('out/marks.json', JSON.stringify(marks))
await browser.close()
