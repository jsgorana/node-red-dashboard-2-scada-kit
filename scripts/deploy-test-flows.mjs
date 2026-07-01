/**
 * Deploy SCADA Kit test flows to Docker Node-RED.
 *
 * Adds three new flow tabs without touching existing flows:
 *   1. SCADA Test — Mimic        (/scada/test/mimic)
 *   2. SCADA Test — Faceplates   (/scada/test/faceplates)
 *   3. SCADA Test — Symbols      (/scada/test/symbols)
 *
 * Safety:
 *   - Uses POST /flow (singular) per tab — never POST /flows
 *   - Checks for existing tabs by ID before posting; skips if already present
 *   - Never modifies or deletes existing flows
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot   = path.resolve(__dirname, '..')
const BASE       = process.env.NODE_RED_ADMIN_URL || 'http://localhost:1880'
const CATALOG    = JSON.parse(fs.readFileSync(path.join(repoRoot, 'packages/scada/symbols/src/catalog.json'), 'utf8'))
const SYMBOL_DIR = path.join(repoRoot, 'packages/scada/symbols/src')

// ─── helpers ─────────────────────────────────────────────────────────────────

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'content-type': 'application/json', 'accept': 'application/json', ...(opts.headers || {}) },
    ...opts,
  })
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} → ${res.status}: ${await res.text()}`)
  return res.json()
}

async function existingTabIds() {
  const flows = await api('/flows')
  return new Set(flows.filter(n => n.type === 'tab').map(n => n.id))
}

async function deployTab(label, id, nodes) {
  const existing = await existingTabIds()
  if (existing.has(id)) {
    console.log(`  ↩ Tab already present, updating: ${label}`)
    await api(`/flow/${id}`, { method: 'PUT', body: JSON.stringify({ id, label, nodes }) })
  } else {
    console.log(`  + Deploying new tab: ${label}`)
    await api('/flow', { method: 'POST', body: JSON.stringify({ id, label, nodes }) })
  }
  return id
}

function innerSvg(file) {
  const raw = fs.readFileSync(path.join(SYMBOL_DIR, file), 'utf8')
  const m = raw.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/)
  if (!m) throw new Error(`Cannot parse ${file}`)
  return m[1].trim()
}

// ─── Shared Dashboard config nodes ───────────────────────────────────────────
// Created by the mimic tab; referenced by faceplate + symbols tabs.
// Config node IDs are globally unique in Node-RED — only create once.

const SHARED_BASE_ID  = 'scada-test-ui-base'
const SHARED_THEME_ID = 'scada-test-ui-theme'

const sharedConfigNodes = [
  {
    id: SHARED_BASE_ID,
    type: 'ui-base',
    name: 'SCADA Test UI',
    path: '/scada/test',
    includeClientData: true,
    acceptsClientConfig: ['ui-notification', 'ui-control'],
    showPathInSidebar: false,
    navigationStyle: 'default',
    titleBarStyle: 'default',
  },
  {
    id: SHARED_THEME_ID,
    type: 'ui-theme',
    name: 'HP-HMI Test Theme',
    colors: { surface: '#f5f5f5', primary: '#546e7a', bgPage: '#eeeeee', groupBg: '#e0e0e0', groupOutline: '#bdbdbd' },
    sizes: { pagePadding: '12px', groupGap: '12px', groupBorderRadius: '4px', widgetGap: '6px' },
  },
]

// ─── TAB 1 — Mimic ───────────────────────────────────────────────────────────

const MIMIC_TAB_ID = 'scada-test-mimic-tab'

const mimicNodes = [
  ...sharedConfigNodes,
  {
    id: 'scada-test-mimic-page',
    type: 'ui-page', name: 'Mimic Test', ui: SHARED_BASE_ID, path: '/mimic',
    icon: 'mdi-pipe', layout: 'grid', theme: SHARED_THEME_ID,
    breakpoints: [{ name: 'Default', px: '0', cols: '3' }],
    order: 1, visible: 'true', disabled: 'false',
  },
  {
    id: 'scada-test-mimic-group',
    type: 'ui-group', name: 'Tank & Pump', page: 'scada-test-mimic-page',
    width: '3', height: '3', order: 1, showTitle: true, visible: 'true', disabled: 'false', groupType: 'default',
  },
  {
    id: 'scada-test-mimic-node',
    type: 'ui-scada-mimic',
    z: MIMIC_TAB_ID,
    name: 'Tank + Pump',
    group: 'scada-test-mimic-group',
    width: '3', height: '6',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <style>:root{--hmi-running:#1565c0;--hmi-stopped:#9e9e9e;--hmi-nofeedback:#bdbdbd;--hmi-bg-display:#f5f5f5;--hmi-alarm-high:#c62828}</style>
  <rect width="400" height="300" fill="var(--hmi-bg-display,#f5f5f5)"/>
  <!-- Tank shell -->
  <rect x="40" y="44" width="100" height="152" rx="4" fill="none" stroke="#616161" stroke-width="2"/>
  <!-- Tank fill — driven by level binding -->
  <rect id="TK01_fill" x="44" y="44" width="92" height="152" fill="#5c85d6" opacity="0.6"/>
  <text x="90" y="218" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#424242" stroke="none">TK-01</text>
  <text id="TK01_level_text" x="90" y="232" text-anchor="middle" font-family="monospace" font-size="10" fill="#212121" stroke="none">-- %</text>
  <!-- Process pipe -->
  <line x1="140" y1="170" x2="210" y2="155" stroke="#757575" stroke-width="5"/>
  <!-- Pump body — fill changes with run state -->
  <circle id="P101_body" cx="240" cy="140" r="32" fill="#9e9e9e" stroke="#616161" stroke-width="2"/>
  <polygon points="240,120 260,152 220,152" fill="#616161"/>
  <text x="240" y="188" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#424242" stroke="none">P-101</text>
  <text id="P101_status" x="240" y="201" text-anchor="middle" font-family="monospace" font-size="9" fill="#616161" stroke="none">STOPPED</text>
  <text id="P101_amps" x="240" y="213" text-anchor="middle" font-family="monospace" font-size="9" fill="#424242" stroke="none">-- A</text>
  <!-- Clickable overlay — tests click event delivery -->
  <circle id="P101_click" cx="240" cy="140" r="34" fill="transparent" style="cursor:pointer" role="button" aria-label="P-101 faceplate"/>
</svg>`,
    bindings: JSON.stringify({
      bindings: [
        { id: 'tank-fill',   selector: '#TK01_fill',       source: 'TK01.level', target: { type: 'level',     axis: 'y', max: 152 }, transform: { default: '0',    quality: { onBad: '0' } } },
        { id: 'tank-text',   selector: '#TK01_level_text', source: 'TK01.level', target: { type: 'text' },                            transform: { format: { decimals: 1, suffix: ' %' }, default: '-- %', quality: { onBad: '-- %' } } },
        { id: 'pump-fill',   selector: '#P101_body',       source: 'P101.run',   target: { type: 'style',     name: 'fill' },         transform: { valueMap: { 'true': 'var(--hmi-running,#1565c0)', 'false': 'var(--hmi-stopped,#9e9e9e)' }, default: 'var(--hmi-nofeedback,#bdbdbd)', quality: { onBad: 'var(--hmi-nofeedback,#bdbdbd)' } } },
        { id: 'pump-status', selector: '#P101_status',     source: 'P101.run',   target: { type: 'text' },                            transform: { valueMap: { 'true': 'RUNNING', 'false': 'STOPPED' }, default: 'NO DATA' } },
        { id: 'pump-amps',   selector: '#P101_amps',       source: 'P101.amps',  target: { type: 'text' },                            transform: { format: { decimals: 1, suffix: ' A' }, default: '-- A' } },
      ],
      events: [
        { selector: '#P101_click', action: 'click', emit: { topic: 'open-faceplate', payload: { equip: 'P101', type: 'motor' } } },
      ],
    }),
    commLossTimeout: 10000,
    x: 200, y: 80,
    wires: [['scada-test-mimic-debug']],
  },
  {
    id: 'scada-test-mimic-inject',
    type: 'inject', z: MIMIC_TAB_ID,
    name: 'Simulate tags (2 s)',
    props: [{ p: 'payload' }],
    repeat: '2', once: true, onceDelay: 0.5,
    payload: '', payloadType: 'date',
    x: 200, y: 180,
    wires: [['scada-test-mimic-fn']],
  },
  {
    id: 'scada-test-mimic-fn',
    type: 'function', z: MIMIC_TAB_ID,
    name: 'Tag simulator',
    func: [
      'var t = Date.now() / 8000;',
      'var level = 50 + 30 * Math.sin(t);',
      'var running = level > 40;',
      "msg.payload = {",
      "  'TK01.level': { value: Math.round(level * 10) / 10, quality: 'good', units: '%' },",
      "  'P101.run':   { value: running, quality: 'good' },",
      "  'P101.amps':  { value: running ? Math.round((8 + 4 * Math.random()) * 10) / 10 : 0, quality: 'good', units: 'A' }",
      '};',
      'return msg;',
    ].join('\n'),
    outputs: 1, x: 400, y: 180,
    wires: [['scada-test-mimic-node']],
  },
  {
    id: 'scada-test-mimic-debug',
    type: 'debug', z: MIMIC_TAB_ID,
    name: 'Click events (test event delivery)',
    active: true, tosidebar: true, complete: 'true', targetType: 'full',
    x: 420, y: 80, wires: [],
  },

  // ── Comm-loss test: inject bad quality to trigger fallback ──
  {
    id: 'scada-test-commloss-inject',
    type: 'inject', z: MIMIC_TAB_ID,
    name: 'Simulate comm-loss (bad quality)',
    props: [{ p: 'payload' }],
    once: false, repeat: '',
    payload: JSON.stringify({ 'TK01.level': { value: null, quality: 'bad' }, 'P101.run': { value: null, quality: 'bad' }, 'P101.amps': { value: null, quality: 'bad' } }),
    payloadType: 'json',
    x: 200, y: 260, wires: [['scada-test-mimic-node']],
  },

  // ── Topic scalar update test ──
  {
    id: 'scada-test-scalar-inject',
    type: 'inject', z: MIMIC_TAB_ID,
    name: 'Scalar topic update (TK01.level → 95)',
    props: [{ p: 'payload' }, { p: 'topic', vt: 'str' }],
    once: false, repeat: '',
    payload: '95',
    payloadType: 'num',
    topic: 'TK01.level',
    x: 200, y: 320, wires: [['scada-test-mimic-node']],
  },
]

// ─── TAB 2 — Faceplates (Motor + Valve + PID) ────────────────────────────────

const FACEPLATE_TAB_ID = 'scada-test-faceplate-tab'

const faceplateNodes = [
  // Re-use shared config nodes (already created by mimic tab — do NOT repeat their definitions)
  {
    id: 'scada-test-fp-page',
    type: 'ui-page', name: 'Faceplates', ui: SHARED_BASE_ID, path: '/faceplates',
    icon: 'mdi-tune-vertical', layout: 'grid', theme: SHARED_THEME_ID,
    breakpoints: [{ name: 'Default', px: '0', cols: '12' }],
    order: 2, visible: 'true', disabled: 'false',
  },
  // Motor group + faceplate
  {
    id: 'scada-test-fp-motor-group',
    type: 'ui-group', name: 'Motor P-101', page: 'scada-test-fp-page',
    width: '4', height: '5', order: 1, showTitle: true, visible: 'true', disabled: 'false', groupType: 'default',
  },
  {
    id: 'scada-test-fp-motor',
    type: 'ui-scada-faceplate', z: FACEPLATE_TAB_ID,
    name: 'P-101 Motor', group: 'scada-test-fp-motor-group',
    width: '4', height: '5', label: 'P-101', template: 'motor',
    min: '', max: '', allowRoles: 'operator, supervisor, engineer',
    includeClientData: true,
    x: 600, y: 80,
    wires: [['scada-test-fp-motor-out1'], ['scada-test-fp-audit-debug']],
  },
  // Valve group + faceplate
  {
    id: 'scada-test-fp-valve-group',
    type: 'ui-group', name: 'Valve FV-201', page: 'scada-test-fp-page',
    width: '4', height: '5', order: 2, showTitle: true, visible: 'true', disabled: 'false', groupType: 'default',
  },
  {
    id: 'scada-test-fp-valve',
    type: 'ui-scada-faceplate', z: FACEPLATE_TAB_ID,
    name: 'FV-201 Valve', group: 'scada-test-fp-valve-group',
    width: '4', height: '5', label: 'FV-201', template: 'valve',
    min: '', max: '', allowRoles: 'operator, supervisor, engineer',
    includeClientData: true,
    x: 600, y: 180,
    wires: [['scada-test-fp-valve-out1'], ['scada-test-fp-audit-debug']],
  },
  // PID group + faceplate
  {
    id: 'scada-test-fp-pid-group',
    type: 'ui-group', name: 'PID TIC-301', page: 'scada-test-fp-page',
    width: '4', height: '5', order: 3, showTitle: true, visible: 'true', disabled: 'false', groupType: 'default',
  },
  {
    id: 'scada-test-fp-pid',
    type: 'ui-scada-faceplate', z: FACEPLATE_TAB_ID,
    name: 'TIC-301 PID', group: 'scada-test-fp-pid-group',
    width: '4', height: '5', label: 'TIC-301', template: 'pid',
    min: '0', max: '100', allowRoles: 'operator, supervisor, engineer',
    includeClientData: true,
    x: 600, y: 280,
    wires: [['scada-test-fp-pid-out1'], ['scada-test-fp-audit-debug']],
  },
  // State simulator inject → all three faceplates
  {
    id: 'scada-test-fp-inject',
    type: 'inject', z: FACEPLATE_TAB_ID,
    name: 'Seed faceplate state (2 s)',
    props: [{ p: 'payload' }],
    repeat: '2', once: true, onceDelay: 0.5,
    payload: '', payloadType: 'date',
    x: 180, y: 80, wires: [['scada-test-fp-state-fn']],
  },
  {
    id: 'scada-test-fp-state-fn',
    type: 'function', z: FACEPLATE_TAB_ID,
    name: 'State simulator',
    func: [
      'var t = Date.now() / 10000;',
      'var motorState = { pv: Math.round((8 + 2 * Math.sin(t)) * 10) / 10, sp: 10, mode: "AUTO", status: "RUNNING", interlock: false };',
      'var valveState = { pv: Math.round(75 + 5 * Math.sin(t * 1.3)) * 1 / 1, sp: 80, mode: "MAN",  status: "OPEN",    interlock: false };',
      'var pidState   = { pv: Math.round((47 + 4 * Math.sin(t * 0.7)) * 10) / 10, sp: 50, mode: "AUTO", status: "RUNNING", interlock: false };',
      '// Send the same state to all three faceplates in sequence',
      'return [',
      '  { ...msg, payload: motorState },',
      '  { ...msg, payload: valveState },',
      '  { ...msg, payload: pidState }',
      '];',
    ].join('\n'),
    outputs: 3,
    x: 390, y: 80,
    wires: [
      ['scada-test-fp-motor'],
      ['scada-test-fp-valve'],
      ['scada-test-fp-pid'],
    ],
  },
  // ── Interlock test ──
  {
    id: 'scada-test-fp-interlock-inject',
    type: 'inject', z: FACEPLATE_TAB_ID,
    name: 'Toggle interlock on P-101',
    props: [{ p: 'payload' }],
    once: false, repeat: '',
    payload: JSON.stringify({ pv: 9.1, sp: 10, mode: 'AUTO', status: 'RUNNING', interlock: true }),
    payloadType: 'json',
    x: 180, y: 200, wires: [['scada-test-fp-motor']],
  },
  // Debug outputs
  {
    id: 'scada-test-fp-motor-out1',
    type: 'debug', z: FACEPLATE_TAB_ID,
    name: 'Motor — allowed write / state',
    active: true, tosidebar: true, complete: 'payload', targetType: 'msg',
    x: 840, y: 80, wires: [],
  },
  {
    id: 'scada-test-fp-valve-out1',
    type: 'debug', z: FACEPLATE_TAB_ID,
    name: 'Valve — allowed write / state',
    active: true, tosidebar: true, complete: 'payload', targetType: 'msg',
    x: 840, y: 180, wires: [],
  },
  {
    id: 'scada-test-fp-pid-out1',
    type: 'debug', z: FACEPLATE_TAB_ID,
    name: 'PID — allowed write / state',
    active: true, tosidebar: true, complete: 'payload', targetType: 'msg',
    x: 840, y: 280, wires: [],
  },
  {
    id: 'scada-test-fp-audit-debug',
    type: 'debug', z: FACEPLATE_TAB_ID,
    name: 'AUDIT — all write attempts (denied + allowed)',
    active: true, tosidebar: true, complete: 'payload', targetType: 'msg',
    x: 840, y: 380, wires: [],
  },
]

// ─── TAB 3 — Symbols gallery ─────────────────────────────────────────────────

const SYMBOLS_TAB_ID = 'scada-test-symbols-tab'

const HMI_THEME_VARS = [
  '--hmi-running:#9e9e9e', '--hmi-stopped:#616161', '--hmi-nofeedback:#bdbdbd',
  '--hmi-starting:#78909c', '--hmi-stopping:#78909c',
  '--hmi-alarm-high:#f44336', '--hmi-alarm-med:#ff9800', '--hmi-alarm-low:#ffc107',
  '--hmi-alarm-advisory:#8bc34a', '--hmi-alarm-unack:#f44336',
  '--hmi-alarm-shelved:#9c27b0', '--hmi-alarm-oos:#607d8b',
  '--hmi-bg-display:#f5f5f5', '--hmi-bg-panel:#eeeeee', '--hmi-bg-group:#e0e0e0',
  '--hmi-line-normal:#757575', '--hmi-line-active:#424242',
  '--hmi-text-primary:#212121', '--hmi-text-secondary:#616161',
  '--hmi-text-value:#212121', '--hmi-text-label:#757575',
].join(';')

const GALLERY = { width: 1440, height: 680, cols: 6, cellW: 230, cellH: 270, padX: 30, padY: 58, symbolW: 178, symbolH: 148 }

function buildGallerySVG() {
  const rows = Math.ceil(CATALOG.symbols.length / GALLERY.cols)
  const totalH = GALLERY.padY + rows * GALLERY.cellH + 40
  const cells = CATALOG.symbols.map((sym, i) => {
    const col = i % GALLERY.cols
    const row = Math.floor(i / GALLERY.cols)
    const cx = GALLERY.padX + col * GALLERY.cellW
    const cy = GALLERY.padY + row * GALLERY.cellH
    const inner = innerSvg(sym.file)
    return `
<g transform="translate(${cx},${cy})">
  <rect width="${GALLERY.cellW - 10}" height="${GALLERY.cellH - 10}" rx="4" fill="#f9f9f9" stroke="#e0e0e0" stroke-width="1"/>
  <g id="${sym.id}" transform="translate(${(GALLERY.cellW - 10 - GALLERY.symbolW) / 2},8)">
    <svg width="${GALLERY.symbolW}" height="${GALLERY.symbolH}" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">${inner}</svg>
  </g>
  <text x="${(GALLERY.cellW - 10) / 2}" y="${GALLERY.symbolH + 28}" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#212121" stroke="none">${sym.label}</text>
  <text id="${sym.id}-result" x="${(GALLERY.cellW - 10) / 2}" y="${GALLERY.symbolH + 46}" text-anchor="middle" font-family="monospace" font-size="9" fill="#616161" stroke="none">--</text>
</g>`
  }).join('\n')

  const statusText = `<text id="gallery-status" x="${GALLERY.width - 20}" y="38" text-anchor="end" font-family="monospace" font-size="11" fill="#616161" stroke="none">Loading…</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GALLERY.width} ${totalH}">
  <style>:root{${HMI_THEME_VARS}}</style>
  <rect width="${GALLERY.width}" height="${totalH}" fill="var(--hmi-bg-display,#f5f5f5)"/>
  <text x="20" y="38" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="#212121" stroke="none">HP-HMI Symbol Gallery — ${CATALOG.symbols.length} symbols</text>
  ${statusText}
  ${cells}
</svg>`
}

function buildSymbolBindings() {
  const bindings = []
  const STATUS_MAP = {
    RUNNING: 'var(--hmi-running,#9e9e9e)',
    STOPPED: 'var(--hmi-stopped,#616161)',
    ALARM:   'var(--hmi-alarm-high,#f44336)',
  }
  const FILL_DEFAULT = 'var(--hmi-nofeedback,#bdbdbd)'

  for (const sym of CATALOG.symbols) {
    for (const b of (sym.bindings || [])) {
      const target = b.target  // e.g. "pump-body"
      const sel    = `#${target}`

      if (b.type === 'attr' && b.attr === 'fill') {
        // body fill — driven by status string
        bindings.push({
          selector: sel, source: `${sym.id}.status`,
          target: { type: 'style', name: 'fill' },
          transform: { valueMap: STATUS_MAP, default: FILL_DEFAULT },
        })
      } else if (b.type === 'attr' && b.attr === 'stroke') {
        bindings.push({
          selector: sel, source: `${sym.id}.status`,
          target: { type: 'style', name: 'stroke' },
          transform: { valueMap: STATUS_MAP, default: FILL_DEFAULT },
        })
      } else if (b.type === 'text') {
        const isValue = target.includes('value')
        if (isValue) {
          bindings.push({
            selector: sel, source: `${sym.id}.value`,
            target: { type: 'text' },
            transform: { format: { decimals: 0, suffix: '%' }, default: '--' },
          })
        } else {
          bindings.push({
            selector: sel, source: `${sym.id}.status`,
            target: { type: 'text' },
            transform: { default: '--' },
          })
        }
      } else if (b.type === 'visibility') {
        const alarmEl = target.includes('alarm')
        bindings.push({
          selector: sel, source: alarmEl ? `${sym.id}.alarm` : `${sym.id}.status`,
          target: { type: 'visibility' },
          transform: alarmEl
            ? { default: 'false' }
            : { valueMap: { RUNNING: 'true', STOPPED: 'false', ALARM: 'false' }, default: 'false' },
        })
      } else if (b.type === 'level' || target.includes('level') || target.includes('bargraph-value')) {
        bindings.push({
          selector: sel, source: `${sym.id}.value`,
          target: { type: 'level', axis: 'y', max: 100 },
          transform: { default: '0', quality: { onBad: '0' } },
        })
      }
    }
    // Result cell: show current status
    bindings.push({
      selector: `#${sym.id}-result`, source: `${sym.id}.status`,
      target: { type: 'text' },
      transform: { default: '??' },
    })
  }
  return { bindings, events: [] }
}

function buildSymbolSimFn() {
  const lines = ['var states = ["RUNNING","STOPPED","ALARM"];', 'var t = Math.floor(Date.now() / 3000);', 'msg.payload = {};']
  CATALOG.symbols.forEach((sym, i) => {
    lines.push(`msg.payload['${sym.id}.status'] = states[(t + ${i}) % 3];`)
    lines.push(`msg.payload['${sym.id}.value']  = Math.round(20 + 60 * Math.abs(Math.sin((t + ${i}) * 0.5)));`)
    lines.push(`msg.payload['${sym.id}.alarm']  = ((t + ${i}) % 3 === 2);`)
  })
  lines.push('return msg;')
  return lines.join('\n')
}

const symbolsNodes = [
  {
    id: 'scada-test-sym-page',
    type: 'ui-page', name: 'Symbol Gallery', ui: SHARED_BASE_ID, path: '/symbols',
    icon: 'mdi-shape', layout: 'grid', theme: SHARED_THEME_ID,
    breakpoints: [{ name: 'Default', px: '0', cols: '12' }],
    order: 3, visible: 'true', disabled: 'false',
  },
  {
    id: 'scada-test-sym-group',
    type: 'ui-group', name: 'HP-HMI Symbol Library', page: 'scada-test-sym-page',
    width: '12', height: '6', order: 1, showTitle: true, visible: 'true', disabled: 'false', groupType: 'default',
  },
  {
    id: 'scada-test-sym-mimic',
    type: 'ui-scada-mimic', z: SYMBOLS_TAB_ID,
    name: 'Symbol Gallery', group: 'scada-test-sym-group',
    width: '12', height: '10',
    svg: buildGallerySVG(),
    bindings: JSON.stringify(buildSymbolBindings()),
    commLossTimeout: 15000,
    x: 400, y: 80, wires: [['scada-test-sym-debug']],
  },
  {
    id: 'scada-test-sym-inject',
    type: 'inject', z: SYMBOLS_TAB_ID,
    name: 'Cycle symbol states (3 s)',
    props: [{ p: 'payload' }],
    repeat: '3', once: true, onceDelay: 0.5,
    payload: '', payloadType: 'date',
    x: 180, y: 80, wires: [['scada-test-sym-fn']],
  },
  {
    id: 'scada-test-sym-fn',
    type: 'function', z: SYMBOLS_TAB_ID,
    name: 'Symbol state simulator',
    func: buildSymbolSimFn(),
    outputs: 1, x: 280, y: 80,
    wires: [['scada-test-sym-mimic']],
  },
  {
    id: 'scada-test-sym-debug',
    type: 'debug', z: SYMBOLS_TAB_ID,
    name: 'Symbol events',
    active: true, tosidebar: true, complete: 'true', targetType: 'full',
    x: 600, y: 80, wires: [],
  },
]

// ─── Deploy ───────────────────────────────────────────────────────────────────

console.log('\n📦 SCADA Kit — Test Deployment\n')
console.log(`Target: ${BASE}`)

// Verify package is installed
const allNodes = await api('/nodes')
const scadaNodes = allNodes.filter(n => n.module === '@jsgorana/node-red-dashboard-2-scada' && n.enabled)
if (scadaNodes.length < 2) {
  console.error('❌  @jsgorana/node-red-dashboard-2-scada not installed or not enabled — run dev-install.sh first')
  process.exit(1)
}
console.log(`✓  Package: @jsgorana/node-red-dashboard-2-scada v${scadaNodes[0].version} (both nodes enabled)`)

// Show existing tabs (safety check)
const existingFlows = await api('/flows')
const existingTabs  = existingFlows.filter(n => n.type === 'tab')
console.log(`\nExisting flow tabs (will NOT be touched):`)
existingTabs.forEach(t => console.log(`  • [${t.id}] ${t.label}`))

const testTabIds = new Set([MIMIC_TAB_ID, FACEPLATE_TAB_ID, SYMBOLS_TAB_ID])
const personalTabs = existingTabs.filter(t => !testTabIds.has(t.id))
if (personalTabs.length !== existingTabs.length) {
  console.log(`\nℹ  Some test tabs already deployed — will update in place.`)
}

console.log('\n🚀 Deploying test tabs...\n')

await deployTab('SCADA Test — Mimic',     MIMIC_TAB_ID,     { id: MIMIC_TAB_ID,     label: 'SCADA Test — Mimic',     nodes: mimicNodes })
await deployTab('SCADA Test — Faceplates', FACEPLATE_TAB_ID, { id: FACEPLATE_TAB_ID, label: 'SCADA Test — Faceplates', nodes: faceplateNodes })
await deployTab('SCADA Test — Symbols',   SYMBOLS_TAB_ID,   { id: SYMBOLS_TAB_ID,   label: 'SCADA Test — Symbols',   nodes: symbolsNodes })

// Final verification
const finalFlows = await api('/flows')
const finalTabs  = finalFlows.filter(n => n.type === 'tab')
console.log('\n✅  Deployment complete.')
console.log(`\nAll flow tabs (${finalTabs.length} total):`)
finalTabs.forEach(t => {
  const isNew = testTabIds.has(t.id)
  console.log(`  ${isNew ? '★' : '·'} [${t.id}] ${t.label}`)
})

console.log('\n📊 Dashboard URLs:')
console.log(`  Mimic:      ${BASE}/scada/test/mimic`)
console.log(`  Faceplates: ${BASE}/scada/test/faceplates`)
console.log(`  Symbols:    ${BASE}/scada/test/symbols`)

console.log('\n🧪 Run the test plan: docs/test-plan.md\n')
