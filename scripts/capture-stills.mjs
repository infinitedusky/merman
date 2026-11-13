// `pnpm capture`: renders the real scene via the dev-only dev/capture.html and writes the site's PNGs into public/.
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright-core'

const root = fileURLToPath(new URL('..', import.meta.url))
const out = (f) => fileURLToPath(new URL(`../public/${f}`, import.meta.url))

const SHOTS = [
  { file: 'poster.png', sample: 'flow', mode: 'iso', width: 1080, height: 460, scale: 2 },
  { file: 'og.png', sample: 'flow', mode: '3d', width: 1200, height: 630, scale: 1 },
  { file: 'still-flat.png', sample: 'flow', mode: 'flat', width: 800, height: 500, scale: 1 },
  { file: 'still-iso.png', sample: 'flow', mode: 'iso', width: 800, height: 500, scale: 1 },
  { file: 'still-3d.png', sample: 'flow', mode: '3d', width: 800, height: 500, scale: 1 },
  { file: 'still-seq.png', sample: 'seq', mode: '3d', width: 800, height: 500, scale: 1 },
]

const server = await createServer({ root, logLevel: 'warn', server: { port: 5199, strictPort: false } })
let browser
try {
  await server.listen()
  const base = server.resolvedUrls.local[0]
  browser = await chromium.launch({
    channel: 'chrome',
    executablePath: process.env.CHROME_PATH,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  })
  for (const s of SHOTS) {
    const ctx = await browser.newContext({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: s.scale })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => console.error(`[${s.file}] ${e.message}`))
    await page.goto(new URL(`dev/capture.html?sample=${s.sample}&mode=${s.mode}`, base).href)
    await page.waitForSelector('body[data-ready]', { timeout: 60_000 })
    await page.screenshot({ path: out(s.file) })
    await ctx.close()
    console.log(`wrote public/${s.file} (${s.width * s.scale}x${s.height * s.scale})`)
  }
} finally {
  await browser?.close()
  await server.close()
}

const seen = new Map()
let dup = false
for (const s of SHOTS) {
  const h = createHash('sha256').update(await readFile(out(s.file))).digest('hex')
  if (seen.has(h)) { console.error(`duplicate: ${s.file} is identical to ${seen.get(h)}`); dup = true }
  else seen.set(h, s.file)
}
if (dup) process.exit(1)
