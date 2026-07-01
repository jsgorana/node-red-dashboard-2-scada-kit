import { chromium } from 'playwright'
import fs from 'node:fs'

const url = process.env.PHASE3_SYMBOLS_URL || 'http://localhost:1880/scada/symbols'
const expectedSymbols = 11
const chromeExecutable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

function parseRgb(value) {
  const match = String(value).match(/rgba?\(([^)]+)\)/)
  if (!match) return null
  const [r, g, b] = match[1].split(',').slice(0, 3).map((part) => Number.parseFloat(part.trim()))
  return [r, g, b].every(Number.isFinite) ? [r, g, b] : null
}

function clamp(value) {
  return Math.max(0, Math.min(255, value))
}

function deuteranopia([r, g, b]) {
  return [
    clamp(0.367 * r + 0.861 * g - 0.228 * b),
    clamp(0.280 * r + 0.673 * g + 0.047 * b),
    clamp(-0.012 * r + 0.043 * g + 0.969 * b),
  ]
}

function distance(a, b) {
  return Math.sqrt(a.reduce((sum, value, index) => sum + ((value - b[index]) ** 2), 0))
}

function assert(checks, condition, message, details = undefined) {
  checks.push({ ok: Boolean(condition), message, details })
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true })
  } catch (error) {
    if (fs.existsSync(chromeExecutable)) {
      return chromium.launch({ headless: true, executablePath: chromeExecutable })
    }
    throw error
  }
}

const browser = await launchBrowser()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

try {
  await page.goto(`${url}?verify=${Date.now()}`, { waitUntil: 'load' })
  await page.waitForSelector('svg[aria-labelledby="phase3-title phase3-desc"]', { timeout: 10000 })
  await page.waitForTimeout(1500)

  const metrics = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return null
      const rect = el.getBoundingClientRect()
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      }
    }

    const root = document.querySelector('svg[aria-labelledby="phase3-title phase3-desc"]')
    const widget = document.querySelector('#nrdb-ui-widget-scada-phase3-symbol-mimic')
    const cells = [...document.querySelectorAll('[id^="cell-"]')].map((el) => ({
      id: el.id,
      box: box(el),
    }))
    const passLabels = [...document.querySelectorAll('[id^="test-"][id$="-result"]')].map((el) => el.textContent || '')
    const paints = Object.fromEntries(
      ['pump-body', 'motor-body', 'tank-shell', 'pump-alarm-shape', 'phase3-summary'].map((id) => {
        const el = document.getElementById(id)
        if (!el) return [id, null]
        const style = getComputedStyle(el)
        return [id, {
          fill: style.fill,
          stroke: style.stroke,
          display: style.display,
          box: box(el),
          text: el.textContent,
        }]
      })
    )

    return {
      url: window.location.href,
      title: document.title,
      summary: document.querySelector('#phase3-summary')?.textContent || '',
      root: {
        box: box(root),
        viewBox: root?.getAttribute('viewBox'),
        preserveAspectRatio: root?.getAttribute('preserveAspectRatio'),
        nestedSvgCount: root ? root.querySelectorAll('svg').length : 0,
      },
      widget: box(widget),
      cells,
      passCount: passLabels.filter((label) => label.includes('PASS')).length,
      shapeAlarmPassCount: passLabels.filter((label) => label.includes('SHAPE+TEXT')).length,
      paints,
    }
  })

  const checks = []
  assert(checks, metrics.root.box !== null, 'gallery root SVG exists')
  assert(checks, metrics.widget !== null, 'Dashboard widget exists')
  assert(checks, metrics.root.viewBox === '0 0 1440 640', 'gallery viewBox is the fixed wide test geometry', metrics.root.viewBox)
  assert(checks, metrics.root.preserveAspectRatio === 'xMidYMin meet', 'gallery uses deterministic contain/top-align sizing', metrics.root.preserveAspectRatio)
  assert(checks, metrics.root.nestedSvgCount === 0, 'gallery contains no nested SVG wrappers', metrics.root.nestedSvgCount)
  assert(checks, metrics.cells.length === expectedSymbols, 'all symbol cells are rendered', metrics.cells.length)
  assert(checks, metrics.passCount === expectedSymbols, 'all symbols report PASS', metrics.passCount)
  assert(checks, metrics.shapeAlarmPassCount > 0, 'alarm test exercises shape+text affordance', metrics.shapeAlarmPassCount)

  if (metrics.root.box && metrics.widget) {
    assert(
      checks,
      Math.abs(metrics.root.box.width - metrics.widget.width) <= 2 && Math.abs(metrics.root.box.height - metrics.widget.height) <= 2,
      'root SVG fills the Dashboard widget box',
      { root: metrics.root.box, widget: metrics.widget }
    )
  }

  const cellWidths = metrics.cells.map((cell) => cell.box?.width).filter(Number.isFinite)
  const cellHeights = metrics.cells.map((cell) => cell.box?.height).filter(Number.isFinite)
  assert(checks, Math.max(...cellWidths) - Math.min(...cellWidths) <= 2, 'symbol cell widths are stable', cellWidths)
  assert(checks, Math.max(...cellHeights) - Math.min(...cellHeights) <= 2, 'symbol cell heights are stable', cellHeights)

  const running = parseRgb(metrics.paints['pump-body']?.fill)
  const stopped = parseRgb(metrics.paints['tank-shell']?.fill)
  const alarm = parseRgb(metrics.paints['pump-alarm-shape']?.fill)
  assert(checks, running !== null, 'running paint resolves to an RGB color', metrics.paints['pump-body']?.fill)
  assert(checks, stopped !== null, 'stopped paint resolves to an RGB color', metrics.paints['tank-shell']?.fill)
  assert(checks, alarm !== null, 'alarm paint resolves to an RGB color', metrics.paints['pump-alarm-shape']?.fill)

  if (running && stopped && alarm) {
    const dRunningStopped = distance(deuteranopia(running), deuteranopia(stopped))
    const dAlarmStopped = distance(deuteranopia(alarm), deuteranopia(stopped))
    assert(checks, dRunningStopped >= 40, 'running and stopped remain distinguishable under deuteranopia simulation', Math.round(dRunningStopped))
    assert(checks, dAlarmStopped >= 40, 'alarm and stopped remain distinguishable under deuteranopia simulation', Math.round(dAlarmStopped))
  }

  const failed = checks.filter((check) => !check.ok)
  const report = {
    url,
    summary: metrics.summary,
    checks,
  }

  console.log(JSON.stringify(report, null, 2))

  if (failed.length) {
    process.exitCode = 1
  }
} finally {
  await browser.close()
}
