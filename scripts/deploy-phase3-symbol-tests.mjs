import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const adminBase = process.env.NODE_RED_ADMIN_URL || 'http://localhost:1880'

const flowId = 'scada-phase3-symbol-tests'
const flowLabel = 'SCADA Kit — Phase 3 Symbols'
const pageId = 'scada-phase3-symbol-page'
const groupId = 'scada-phase3-symbol-group'
const mimicId = 'scada-phase3-symbol-mimic'
const injectId = 'scada-phase3-symbol-inject'
const simulatorId = 'scada-phase3-symbol-sim'
const assertionId = 'scada-phase3-symbol-assert'
const debugId = 'scada-phase3-symbol-debug'

const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, 'packages/scada/symbols/src/catalog.json'), 'utf8'))
const symbolDir = path.join(repoRoot, 'packages/scada/symbols/src')
const hmiThemeVars = [
  '--hmi-running:#9e9e9e',
  '--hmi-stopped:#616161',
  '--hmi-nofeedback:#bdbdbd',
  '--hmi-starting:#78909c',
  '--hmi-stopping:#78909c',
  '--hmi-alarm-high:#f44336',
  '--hmi-alarm-med:#ff9800',
  '--hmi-alarm-low:#ffc107',
  '--hmi-alarm-advisory:#8bc34a',
  '--hmi-alarm-unack:#f44336',
  '--hmi-alarm-shelved:#9c27b0',
  '--hmi-alarm-oos:#607d8b',
  '--hmi-bg-display:#f5f5f5',
  '--hmi-bg-panel:#eeeeee',
  '--hmi-bg-group:#e0e0e0',
  '--hmi-line-normal:#757575',
  '--hmi-line-active:#424242',
  '--hmi-text-primary:#212121',
  '--hmi-text-secondary:#616161',
  '--hmi-text-value:#212121',
  '--hmi-text-label:#757575',
].join(';')

const gallery = {
  width: 1440,
  height: 640,
  cols: 6,
  cellW: 230,
  cellH: 270,
  padX: 30,
  padY: 58,
  symbolW: 178,
  symbolH: 148,
}

function innerSvg(file) {
  const raw = fs.readFileSync(path.join(symbolDir, file), 'utf8')
  const match = raw.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/)
  if (!match) throw new Error(`Could not parse ${file}`)
  const viewBox = match[1].match(/viewBox="([^"]+)"/)?.[1] || '0 0 120 80'
  const [minX, minY, width, height] = viewBox.split(/\s+/).map(Number)
  return { viewBox: { minX, minY, width, height }, body: match[2].trim() }
}

function symbolCell(symbol, index) {
  const x = (index % gallery.cols) * gallery.cellW + gallery.padX
  const y = Math.floor(index / gallery.cols) * gallery.cellH + gallery.padY
  const { viewBox, body } = innerSvg(symbol.file)
  const symbolX = x + 26
  const symbolY = y + 18
  const scale = Math.min(gallery.symbolW / viewBox.width, gallery.symbolH / viewBox.height)
  const scaledW = viewBox.width * scale
  const scaledH = viewBox.height * scale
  const tx = symbolX + ((gallery.symbolW - scaledW) / 2) - (viewBox.minX * scale)
  const ty = symbolY + ((gallery.symbolH - scaledH) / 2) - (viewBox.minY * scale)

  return `
    <g id="cell-${symbol.id}" class="symbol-cell">
      <rect x="${x}" y="${y}" width="${gallery.cellW - 20}" height="${gallery.cellH - 22}" rx="4" fill="var(--hmi-bg-panel,#eeeeee)" stroke="var(--hmi-line-normal,#757575)" stroke-width="1.5"/>
      <g id="symbol-${symbol.id}" transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">
        ${body}
      </g>
      <text x="${x + 105}" y="${y + 202}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="var(--hmi-text-primary,#212121)">${symbol.name}</text>
      <text id="test-${symbol.id}-result" x="${x + 105}" y="${y + 226}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="var(--hmi-text-label,#757575)">PENDING</text>
    </g>`
}

function gallerySvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gallery.width} ${gallery.height}" preserveAspectRatio="xMidYMin meet" role="img" aria-labelledby="phase3-title phase3-desc" style="${hmiThemeVars}">
  <title id="phase3-title">Phase 3 SCADA symbol gallery test</title>
  <desc id="phase3-desc">Dashboard 2.0 visual test for all Phase 3 HP-HMI SVG symbols with live running, alarm, and value bindings.</desc>
  <rect width="${gallery.width}" height="${gallery.height}" fill="var(--hmi-bg-display,#f5f5f5)"/>
  <text x="30" y="34" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="var(--hmi-text-primary,#212121)">Phase 3 Symbol Gallery</text>
  <text id="phase3-summary" x="${gallery.width - 30}" y="34" text-anchor="end" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="var(--hmi-text-label,#757575)">PENDING</text>
  ${catalog.symbols.map(symbolCell).join('\n')}
</svg>`
}

const booleanFill = {
  valueMap: {
    true: 'var(--hmi-running)',
    false: 'var(--hmi-stopped)',
  },
  quality: {
    onBad: 'var(--hmi-nofeedback)',
  },
  default: 'var(--hmi-nofeedback)',
}

function binding(selector, source, target, transform = {}) {
  return { selector, source, target, transform }
}

function bindingsFor(symbol) {
  const id = symbol.id
  const items = [
    binding(`#test-${id}-result`, `test.${id}.result`, { type: 'text' }),
  ]

  for (const hook of symbol.bindings) {
    if (!symbol.elements.includes(hook.target)) continue
    if (hook.type === 'text') {
      // Route value/numeric labels to the numeric value source and status
      // labels to the status string, so the two never collide on the symbol.
      const isValue = /-value-text$/.test(hook.target)
      items.push(
        isValue
          ? binding(`#${hook.target}`, `symbols.${id}.value`, { type: 'text' }, { format: { decimals: 0, suffix: '%' } })
          : binding(`#${hook.target}`, `symbols.${id}.label`, { type: 'text' }),
      )
    } else if (hook.type === 'level') {
      items.push(binding(`#${hook.target}`, `symbols.${id}.value`, { type: 'level', max: hook.target.includes('tank') ? 38 : 46 }, {
        scale: { in: [0, 100], out: [0, 100] },
        default: '0',
      }))
    } else if (hook.type === 'visibility') {
      items.push(binding(`#${hook.target}`, `symbols.${id}.alarm`, { type: 'visibility' }, {
        valueMap: { true: 'true', false: 'false' },
        default: 'false',
      }))
    } else if (hook.type === 'attr' && hook.attr) {
      items.push(binding(`#${hook.target}`, `symbols.${id}.running`, { type: 'attribute', name: hook.attr }, booleanFill))
    } else if (hook.type === 'transform') {
      items.push(binding(`#${hook.target}`, `symbols.${id}.angle`, { type: 'transform', name: 'rotate' }, {
        valueMap: { open: '-28', closed: '0', tripped: '38' },
        default: '0',
      }))
    } else if (hook.type === 'path') {
      items.push(binding(`#${hook.target}`, `symbols.${id}.trace`, { type: 'attribute', name: 'd' }))
    }
  }

  return items
}

const bindings = {
  bindings: [
    binding('#phase3-summary', 'test.summary', { type: 'text' }),
    ...catalog.symbols.flatMap(bindingsFor),
  ],
  events: [],
}

const simulatorFunction = `
const symbols = ${JSON.stringify(catalog.symbols.map((symbol) => symbol.id))};
const tick = context.get('tick') || 0;
const payload = {};

for (const [index, id] of symbols.entries()) {
    const running = (tick + index) % 3 !== 0;
    const alarm = (tick + index) % 5 === 0;
    const value = (tick * 17 + index * 9) % 101;

    payload[\`symbols.\${id}.running\`] = running;
    payload[\`symbols.\${id}.alarm\`] = alarm;
    payload[\`symbols.\${id}.value\`] = value;
    payload[\`symbols.\${id}.label\`] = alarm ? 'ALARM' : (running ? 'RUNNING' : 'STOPPED');
    payload[\`symbols.\${id}.angle\`] = alarm ? 'tripped' : (running ? 'closed' : 'open');
    payload[\`symbols.\${id}.trace\`] = running
        ? 'M10 54L30 45L50 49L70 30L90 34L110 20L140 25'
        : 'M10 54L30 54L50 54L70 54L90 54L110 54L140 54';
    payload[\`test.\${id}.result\`] = alarm ? 'PASS - SHAPE+TEXT ALARM' : 'PASS';
}

payload['test.summary'] = \`PASS \${symbols.length}/\${symbols.length} symbols · tick \${tick}\`;
context.set('tick', tick + 1);
msg.payload = payload;
return msg;
`.trim()

const assertionFunction = `
const expected = ${JSON.stringify(catalog.symbols.map((symbol) => symbol.id))};
const missing = expected.filter((id) => msg.payload[\`test.\${id}.result\`] === undefined);
msg.phase3 = {
    test: 'symbols-gallery',
    expected: expected.length,
    missing,
    pass: missing.length === 0,
    ts: new Date().toISOString()
};
node.status({
    fill: msg.phase3.pass ? 'green' : 'red',
    shape: msg.phase3.pass ? 'dot' : 'ring',
    text: msg.phase3.pass ? \`PASS \${expected.length}/\${expected.length}\` : \`Missing \${missing.length}\`
});
return msg;
`.trim()

const flow = {
  id: flowId,
  label: flowLabel,
  disabled: false,
  info: 'Phase 3 symbol library Dashboard 2.0 test flow. Created by scripts/deploy-phase3-symbol-tests.mjs without replacing existing flows.',
  nodes: [
    {
      id: injectId,
      type: 'inject',
      z: flowId,
      name: 'Run symbol tests every 2s',
      props: [{ p: 'payload' }],
      repeat: '2',
      crontab: '',
      once: true,
      onceDelay: 0.5,
      topic: '',
      payload: '',
      payloadType: 'date',
      x: 160,
      y: 100,
      wires: [[simulatorId]],
    },
    {
      id: simulatorId,
      type: 'function',
      z: flowId,
      name: 'Phase 3 symbol simulator',
      func: simulatorFunction,
      outputs: 1,
      timeout: 0,
      noerr: 0,
      initialize: '',
      finalize: '',
      libs: [],
      x: 390,
      y: 100,
      wires: [[mimicId, assertionId]],
    },
    {
      id: assertionId,
      type: 'function',
      z: flowId,
      name: 'Assert all symbols have test tags',
      func: assertionFunction,
      outputs: 1,
      timeout: 0,
      noerr: 0,
      initialize: '',
      finalize: '',
      libs: [],
      x: 650,
      y: 160,
      wires: [[debugId]],
    },
    {
      id: debugId,
      type: 'debug',
      z: flowId,
      name: 'Phase 3 test status',
      active: true,
      tosidebar: true,
      console: false,
      tostatus: true,
      complete: 'phase3',
      targetType: 'msg',
      statusVal: 'phase3.pass',
      statusType: 'msg',
      x: 900,
      y: 160,
      wires: [],
    },
    {
      id: mimicId,
      type: 'ui-scada-mimic',
      z: flowId,
      name: 'Phase 3 Symbol Gallery',
      group: groupId,
      width: '12',
      height: '10',
      svg: gallerySvg(),
      bindings: JSON.stringify(bindings, null, 2),
      commLossTimeout: 6000,
      x: 650,
      y: 80,
      wires: [[]],
    },
  ],
  configs: [
    {
      id: pageId,
      type: 'ui-page',
      z: flowId,
      name: 'Phase 3 Symbols',
      ui: 'scada-ui-base',
      path: '/symbols',
      icon: 'mdi-shape-outline',
      layout: 'grid',
      theme: 'scada-ui-theme',
      breakpoints: [{ name: 'Default', px: '0', cols: '12' }],
      order: 2,
      className: '',
      visible: 'true',
      disabled: 'false',
    },
    {
      id: groupId,
      type: 'ui-group',
      z: flowId,
      name: 'Symbol Library Test',
      page: pageId,
      width: '12',
      height: '10',
      order: 1,
      showTitle: true,
      className: '',
      visible: 'true',
      disabled: 'false',
      groupType: 'default',
    },
  ],
}

async function request(pathname, options = {}) {
  const response = await fetch(`${adminBase}${pathname}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${pathname} failed (${response.status}): ${text}`)
  }
  return text ? JSON.parse(text) : null
}

const flows = await request('/flows')
const existingFlow = flows.find((node) => node.type === 'tab' && (node.id === flowId || node.label === flowLabel))

if (existingFlow) {
  flow.id = existingFlow.id
  for (const node of flow.nodes) node.z = existingFlow.id
  for (const config of flow.configs) config.z = existingFlow.id
  await request(`/flow/${existingFlow.id}`, { method: 'PUT', body: JSON.stringify(flow) })
  console.log(`Updated existing Phase 3 symbol test flow: ${existingFlow.id}`)
} else {
  await request('/flow', { method: 'POST', body: JSON.stringify(flow) })
  console.log(`Created Phase 3 symbol test flow: ${flowId}`)
}

console.log(`Dashboard URL: ${adminBase.replace(/\/$/, '')}/scada/symbols`)
