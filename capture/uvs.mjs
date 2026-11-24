// Screenshots and short recordings of the live UVS Games site for the case study.
// Runs on GitHub Actions (see .github/workflows/capture-uvs.yml). Output goes to ./out
import { chromium, devices } from 'playwright'
import fs from 'node:fs'

const OUT = 'out'
fs.mkdirSync(`${OUT}/raw`, { recursive: true })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await chromium.launch({ channel: 'chrome' })
const marks = {}

const PAGES = [
  ['home', 'https://uvsgames.com/'],
  ['op', 'https://uvsgames.com/organized-play/'],
  ['riftbound', 'https://uvsgames.com/riftbound-organized-play/'],
  ['uvsop', 'https://uvsgames.com/universus-organized-play/'],
  ['cards', 'https://uvsgames.com/universus/cards/'],
  ['universus', 'https://uvsgames.com/universus/'],
  ['shop', 'https://shop.uvsgames.com/collections/all'],
]

async function prep(page) {
  // close cookie / newsletter popups if any
  for (const t of ['Accept', 'Accept all', 'Decline', 'Reject all', 'No thanks', 'Close']) {
    await page.getByRole('button', { name: t, exact: false }).first().click({ timeout: 1500 }).catch(() => {})
  }
  await page.keyboard.press('Escape').catch(() => {})
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)) }
    scrollTo(0, 0)
  })
  await wait(1500)
}

async function shoot(ctxOpts, suffix) {
  const ctx = await browser.newContext(ctxOpts)
  const page = await ctx.newPage()
  for (const [name, url] of PAGES) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
      await wait(2000)
      await prep(page)
      await page.screenshot({ path: `${OUT}/${name}-${suffix}.png`, fullPage: true })
      console.log('shot', name, suffix)
    } catch (e) { console.error(name, suffix, e.message) }
  }
  // a product page from the shop
  try {
    await page.goto('https://shop.uvsgames.com/collections/all', { waitUntil: 'networkidle', timeout: 90000 })
    const href = await page.evaluate(() => [...document.querySelectorAll('a[href*="/products/"]')].map((a) => a.href)[0])
    if (href) {
      await page.goto(href, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
      await wait(2000); await prep(page)
      await page.screenshot({ path: `${OUT}/product-${suffix}.png`, fullPage: true })
      console.log('shot product', suffix, href)
    }
  } catch (e) { console.error('product', e.message) }
  await ctx.close()
}

await shoot({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 }, 'desktop')
await shoot({ ...devices['iPhone 13'] }, 'mobile')

// recordings on a phone: scroll the homepage, the card list and the shop
async function record(name, url, fn) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], recordVideo: { dir: `${OUT}/raw/${name}`, size: { width: 390, height: 844 } } })
  const t0 = Date.now()
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
  await prep(page)
  marks[name] = (Date.now() - t0) / 1000
  try { await fn(page) } catch (e) { console.error(name, e.message) }
  const v = page.video(); await ctx.close()
  fs.renameSync(await v.path(), `${OUT}/raw/${name}.webm`)
}
const smooth = (page, by, ms) => page.evaluate(async ([by, ms]) => {
  const s = scrollY, t0 = performance.now()
  await new Promise((res) => { const st = (n) => { const k = Math.min(1, (n - t0) / ms); scrollTo(0, s + by * (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2)); k < 1 ? requestAnimationFrame(st) : res() }; requestAnimationFrame(st) })
}, [by, ms])
for (const [name, url] of [['home', 'https://uvsgames.com/'], ['riftbound', 'https://uvsgames.com/riftbound-organized-play/'], ['cards', 'https://uvsgames.com/universus/cards/'], ['shop', 'https://shop.uvsgames.com/collections/all']]) {
  await record(name, url, async (page) => {
    await wait(1200)
    for (let i = 0; i < 6; i++) { await smooth(page, 620, 1400); await wait(900) }
  })
}
fs.writeFileSync(`${OUT}/marks.json`, JSON.stringify(marks))
await browser.close()
