// Records and screenshots the live site for the Aeon case study.
// Runs on GitHub Actions (see .github/workflows/capture-aeon.yml). Output goes to ./out
import { chromium } from 'playwright'
import fs from 'node:fs'

const SITE = 'https://aeonfuturehealth.com'
const OUT = 'out'
const VIEW = { width: 1440, height: 900 }
fs.mkdirSync(`${OUT}/raw`, { recursive: true })
const marks = {}
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Google Chrome (not the bundled Chromium) so the site's MP4 videos actually play
const browser = await chromium.launch({ channel: 'chrome' })

async function denyCookies(page) {
  try {
    await page.locator('#CybotCookiebotDialogBodyButtonDecline').click({ timeout: 6000 })
    await wait(800)
  } catch {}
}

async function smoothScrollTo(page, y, ms = 1500) {
  await page.evaluate(
    async ([target, dur]) => {
      const start = scrollY, d = target - start, t0 = performance.now()
      await new Promise((res) => {
        const step = (t) => {
          const p = Math.min(1, (t - t0) / dur)
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
          scrollTo(0, start + d * e)
          p < 1 ? requestAnimationFrame(step) : res()
        }
        requestAnimationFrame(step)
      })
    },
    [y, ms],
  )
}

// Record one clip. `marks` notes when the page was ready so the blank lead-in can be trimmed.
async function record(name, url, fn) {
  const ctx = await browser.newContext({ viewport: VIEW, recordVideo: { dir: `${OUT}/raw/${name}`, size: VIEW } })
  const t0 = Date.now()
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
  await denyCookies(page)
  await wait(1500)
  marks[name] = (Date.now() - t0) / 1000
  try {
    await fn(page)
  } catch (e) {
    console.error(name, e.message)
  }
  await wait(600)
  const v = page.video()
  await ctx.close()
  fs.renameSync(await v.path(), `${OUT}/raw/${name}.webm`)
  console.log('recorded', name, 'start at', marks[name])
}

// 1. Navigation: header, mega menu, browse the columns, close, scroll to show the header
await record('nav', SITE + '/', async (page) => {
  await page.mouse.move(700, 450)
  await wait(1200)
  for (const t of ['Men’s Health', 'Women’s Health']) {
    await page.locator('header a', { hasText: t }).first().hover()
    await wait(700)
  }
  await page.locator('#mega-menu-open').hover()
  await wait(400)
  await page.locator('#mega-menu-open').click()
  await wait(1800)
  for (const [x, y] of [[120, 300], [380, 300], [640, 340], [900, 340], [1180, 340], [1180, 520]]) {
    await page.mouse.move(x, y, { steps: 18 })
    await wait(450)
  }
  await wait(800)
  await page.getByText(/^\s*close\s*$/i).first().click().catch(() => page.keyboard.press('Escape'))
  await wait(1400)
  await smoothScrollTo(page, 900, 1600)
  await wait(900)
  await smoothScrollTo(page, 0, 1400)
  await wait(800)
})

// 2. "How do you feel" cards: hover each so its video plays and the description slides up
await record('cards', SITE + '/', async (page) => {
  const groups = page.locator('.card-video-group')
  await groups.first().scrollIntoViewIfNeeded()
  await wait(600)
  const box0 = await groups.first().boundingBox()
  await page.evaluate((dy) => scrollBy(0, dy), box0.y - 140)
  await wait(1000)
  const n = await groups.count()
  for (let i = 0; i < n; i++) {
    const b = await groups.nth(i).boundingBox()
    if (!b) continue
    if (b.y + b.height > VIEW.height - 20) {
      await page.evaluate((dy) => scrollBy({ top: dy, behavior: 'smooth' }), b.y - 140)
      await wait(900)
    }
    const bb = await groups.nth(i).boundingBox()
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 15 })
    await wait(2200)
  }
  await page.mouse.move(VIEW.width - 5, VIEW.height / 2, { steps: 10 })
  await wait(800)
})

// 3. Start here → quiz → recommendation (no personal details are entered)
await record('quiz', SITE + '/booking-flow', async (page) => {
  await wait(800)
  await page.getByText('Find the right program', { exact: false }).first().click()
  await wait(1400)
  for (let q = 0; q < 5; q++) {
    const labels = page.locator('label.custom-checkbox:visible')
    await labels.nth(1).hover()
    await wait(500)
    await labels.nth(1).click()
    await wait(900)
    await page.locator('button:visible', { hasText: 'CONTINUE' }).first().click()
    await wait(1500)
  }
  await wait(2500)
})

// 4. "What to expect" step slider on a program page
await record('steps', SITE + '/program/men-hormonal-health-optimization/', async (page) => {
  const sec = page.locator('.step-section-animation').first()
  const top = await sec.evaluate((el) => el.getBoundingClientRect().top + scrollY)
  await page.evaluate((y) => scrollTo(0, y - 500), top)
  await wait(600)
  await smoothScrollTo(page, top, 1400)
  await wait(1800)
  // A real mouse click on the arrow (a locator click scrolls the page and breaks the effect)
  for (let i = 0; i < 4; i++) {
    const b = await sec.locator('.next-step-btn').first().boundingBox()
    if (!b) break
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 })
    await wait(300)
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2)
    await wait(2400)
  }
  await wait(800)
})

// 5. Screenshots of the homepage sections and a few key pages, plus the list of site videos
{
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(SITE + '/', { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
  await denyCookies(page)
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 200)) }
    scrollTo(0, 0)
  })
  await wait(1500)
  const secs = await page.evaluate(() =>
    [...document.querySelectorAll('section, .section-wrapper')]
      .filter((s) => s.offsetHeight > 300)
      .map((s) => ({ top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight, text: (s.innerText || '').trim().slice(0, 60).replace(/\s+/g, ' ') }))
      .sort((a, b) => a.top - b.top),
  )
  const seen = new Set()
  let i = 0
  for (const s of secs) {
    const key = Math.round(s.top / 80)
    if (seen.has(key)) continue
    seen.add(key)
    await page.evaluate((y) => scrollTo(0, y), Math.max(0, s.top))
    await wait(1400)
    const name = `home-${String(++i).padStart(2, '0')}`
    await page.screenshot({ path: `${OUT}/${name}.png` })
    console.log(name, Math.round(s.top), s.h, s.text)
  }
  const vids = await page.evaluate(() => [...new Set([...document.querySelectorAll('video source, video')].map((v) => v.src || v.currentSrc).filter((s) => /\.mp4/.test(s)))])
  fs.writeFileSync(`${OUT}/videos.txt`, vids.join('\n') + '\n')
  for (const [name, path] of [
    ['page-mens', '/mens-health-clinic/'],
    ['page-womens', '/womens-health/'],
    ['page-program', '/program/men-hormonal-health-optimization/'],
    ['page-pricing', '/pricing/'],
    ['page-about', '/about-us/'],
  ]) {
    await page.goto(SITE + path, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
    await denyCookies(page)
    await wait(2000)
    await page.screenshot({ path: `${OUT}/${name}.png` })
  }
  await ctx.close()
}

fs.writeFileSync(`${OUT}/marks.json`, JSON.stringify(marks, null, 2))
await browser.close()
