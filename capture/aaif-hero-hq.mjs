// Sharp recording of the aaif.io hero: CDP screencast at 2x, then frames → mp4
import { chromium } from 'playwright'
import fs from 'node:fs'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
fs.mkdirSync('out/frames', { recursive: true })
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto('https://aaif.io/', { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
await page.locator('text=/^\\s*Okay\\s*$/').first().click({ timeout: 4000 }).catch(() => {})
await page.addStyleTag({ content: '[class*="cookie" i],[id*="cookie" i],[class*="consent" i],[id*="consent" i],#onetrust-banner-sdk,.osano-cm-window{display:none!important}' })
await page.evaluate(() => { document.querySelectorAll('body *').forEach((el) => { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && /personal data/.test(el.textContent || '')) el.remove() }); scrollTo(0, 0) })
await wait(1500)
const cdp = await ctx.newCDPSession(page)
const frames = []
cdp.on('Page.screencastFrame', async (f) => {
  frames.push({ t: f.metadata.timestamp, data: f.data })
  await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
})
await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: 2880, maxHeight: 1800 })
await page.mouse.move(400, 500)
await wait(4000)
for (const [x, y] of [[300, 400], [900, 300], [1150, 450], [700, 600]]) { await page.mouse.move(x, y, { steps: 30 }); await wait(1200) }
await wait(5000)
await cdp.send('Page.stopScreencast')
await b.close()
let list = ''
frames.forEach((f, i) => {
  const n = String(i).padStart(5, '0')
  fs.writeFileSync(`out/frames/${n}.png`, Buffer.from(f.data, 'base64'))
  const d = i < frames.length - 1 ? Math.max(0.001, frames[i + 1].t - f.t) : 0.5
  list += `file 'frames/${n}.png'\nduration ${d.toFixed(4)}\n`
})
list += `file 'frames/${String(frames.length - 1).padStart(5, '0')}.png'\n`
fs.writeFileSync('out/list.txt', list)
console.log('frames', frames.length)
