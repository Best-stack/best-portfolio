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
  await page.locator('text=/^\\s*Okay\\s*$/').first().click({ timeout: 4000 }).catch(() => {})
  await page.addStyleTag({ content: '[class*="cookie" i],[id*="cookie" i],[class*="consent" i],[id*="consent" i],#onetrust-banner-sdk,.osano-cm-window{display:none!important}' })
  await page.evaluate(() => { for (const el of document.querySelectorAll('body *')) { if (/This website processes personal data/.test(el.textContent || '') && el.children.length < 12 && getComputedStyle(el).position === 'fixed') el.remove() } document.querySelectorAll('body *').forEach((el) => { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && /personal data/.test(el.textContent || '')) el.remove() }) })
  await wait(800)
  try { await fn(page, () => { marks[name] = (Date.now() - t0) / 1000 }) } catch (e) { console.error(name, e.message) }
  const v = page.video(); await ctx.close(); fs.renameSync(await v.path(), 'out/raw/' + name + '.webm')
}
await rec('hero', 'https://aaif.io/', async (page, start) => {
  await page.reload({ waitUntil: 'networkidle' }).catch(() => {})
  await page.evaluate(() => { document.querySelectorAll('body *').forEach((el) => { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && /personal data/.test(el.textContent || '')) el.remove() }); scrollTo(0, 0) })
  start(); await page.mouse.move(400, 500)
  await wait(3000)
  for (const [x, y] of [[300, 400], [900, 300], [1150, 450], [700, 600]]) { await page.mouse.move(x, y, { steps: 30 }); await wait(900) }
  await wait(2500)
})
await rec('events', 'https://aaif.io/events/', async (page, start) => {
  await page.evaluate(() => { const g = document.querySelector('button[aria-label="Grid view"]'); scrollTo(0, g.getBoundingClientRect().top + scrollY - 110) })
  await wait(1500); start(); await wait(1200)
  for (const n of ['Calendar view', 'Map view', 'Grid view']) {
    const b2 = await page.locator(`button[aria-label="${n}"]`).first().boundingBox()
    await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2, { steps: 20 }); await wait(300)
    await page.mouse.click(b2.x + b2.width / 2, b2.y + b2.height / 2); await wait(3200)
  }
})
fs.writeFileSync('out/marks.json', JSON.stringify(marks))
await b.close()
