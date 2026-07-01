import { chromium } from 'playwright'
import fs from 'node:fs'

const url = process.env.PHASE4_FACEPLATE_URL || 'http://localhost:1880/scada-phase4/faceplate'
const adminBase = process.env.NODE_RED_ADMIN_URL || 'http://localhost:1880'
const chromeExecutable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const auditUrl = `${adminBase}/scada-phase4-faceplate/audit`
const resetUrl = `${adminBase}/scada-phase4-faceplate/reset`

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

async function requestJson(requestUrl, options = {}) {
  const response = await fetch(requestUrl, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${requestUrl} failed (${response.status}): ${text}`)
  }
  return text ? JSON.parse(text) : null
}

async function waitForAudit(timeoutMs = 8000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const audit = await requestJson(auditUrl)
    if (audit) return audit
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return null
}

await requestJson(resetUrl, { method: 'POST', body: '{}' })

const browser = await launchBrowser()
const page = await browser.newPage({ viewport: { width: 1280, height: 760 } })

try {
  await page.goto(`${url}?verify=${Date.now()}`, { waitUntil: 'load' })
  await page.waitForSelector('.nrdb-scada-faceplate', { timeout: 12000 })
  await page.getByRole('button', { name: 'Write SP' }).waitFor({ timeout: 12000 })

  const beforeClickAudit = await requestJson(auditUrl)
  await page.locator('input[type="number"]').fill('62.5')
  await page.getByRole('button', { name: 'Write SP' }).click()
  await page.getByRole('dialog', { name: 'Confirm write' }).waitFor({ timeout: 5000 })

  const beforeConfirmAudit = await requestJson(auditUrl)
  await page.getByRole('button', { name: 'Confirm' }).click()

  const audit = await waitForAudit()

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

    const root = document.querySelector('.nrdb-scada-faceplate')
    const widget = document.querySelector('#nrdb-ui-widget-scada-phase4-faceplate-pid')
    const buttons = [...document.querySelectorAll('.nrdb-scada-faceplate button')].map((button) => button.textContent?.trim())

    return {
      url: window.location.href,
      title: document.title,
      widget: box(widget),
      root: box(root),
      buttons,
      dialogVisible: Boolean(document.querySelector('[role="dialog"]')),
      titleText: document.querySelector('.faceplate-title')?.textContent?.trim(),
      stateText: document.querySelector('.faceplate-state')?.textContent?.trim(),
    }
  })

  const checks = []
  assert(checks, metrics.root !== null, 'faceplate root exists')
  assert(checks, metrics.widget !== null, 'Dashboard widget exists')
  assert(checks, metrics.buttons.includes('Write SP'), 'PID template renders Write SP control', metrics.buttons)
  assert(checks, metrics.titleText === 'PID-101 Faceplate', 'faceplate label renders from node config', metrics.titleText)
  assert(checks, beforeClickAudit === null, 'audit endpoint starts empty after reset', beforeClickAudit)
  assert(checks, beforeConfirmAudit === null, 'no audit is emitted before confirmation', beforeConfirmAudit)
  assert(checks, audit !== null, 'audit is captured after confirmation', audit)
  assert(checks, audit?.result === 'DENIED', 'unauthenticated live write is denied', audit?.result)
  assert(checks, audit?.reason === 'role-not-authorized', 'denial reason is role-not-authorized', audit?.reason)
  assert(checks, audit?.action === 'pid.setpoint', 'audit records PID setpoint action', audit?.action)
  assert(checks, audit?.oldValue === 50, 'audit records old setpoint value', audit?.oldValue)
  assert(checks, audit?.newValue === 62.5, 'audit records new setpoint value', audit?.newValue)
  assert(checks, audit?.payload?.setpoint === 62.5, 'audit records confirmed setpoint payload', audit?.payload)
  assert(checks, metrics.dialogVisible === false, 'confirmation dialog closes after confirm', metrics.dialogVisible)

  if (metrics.root && metrics.widget) {
    assert(
      checks,
      metrics.root.width <= metrics.widget.width && metrics.root.height <= metrics.widget.height,
      'faceplate stays inside Dashboard widget bounds',
      { root: metrics.root, widget: metrics.widget }
    )
  }

  const failed = checks.filter((check) => !check.ok)
  const report = {
    url,
    audit,
    metrics,
    checks,
  }

  console.log(JSON.stringify(report, null, 2))

  if (failed.length) {
    process.exitCode = 1
  }
} finally {
  await browser.close()
}
