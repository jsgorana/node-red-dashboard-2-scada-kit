const adminBase = process.env.NODE_RED_ADMIN_URL || 'http://localhost:1880'

const flowId = 'scada-phase4-faceplate-tests'
const flowLabel = 'SCADA Kit — Phase 4 Faceplate'
const pageId = 'scada-phase4-faceplate-page'
const groupId = 'scada-phase4-faceplate-group'
const baseId = 'scada-phase4-ui-base'
const themeId = 'scada-phase4-ui-theme'
const faceplateId = 'scada-phase4-faceplate-pid'
const injectId = 'scada-phase4-faceplate-inject'
const stateId = 'scada-phase4-faceplate-state'
const allowedDebugId = 'scada-phase4-faceplate-allowed-debug'
const auditStoreId = 'scada-phase4-faceplate-audit-store'
const auditDebugId = 'scada-phase4-faceplate-audit-debug'
const auditHttpInId = 'scada-phase4-faceplate-audit-http-in'
const auditHttpFunctionId = 'scada-phase4-faceplate-audit-http-function'
const auditHttpResponseId = 'scada-phase4-faceplate-audit-http-response'
const resetHttpInId = 'scada-phase4-faceplate-reset-http-in'
const resetHttpFunctionId = 'scada-phase4-faceplate-reset-http-function'
const resetHttpResponseId = 'scada-phase4-faceplate-reset-http-response'

const auditContextKey = 'phase4FaceplateAudit'

const stateFunction = `
msg.payload = {
    pv: 47.2,
    sp: 50,
    mode: 'MAN',
    status: 'READY',
    interlocks: [],
    permissives: [
        { id: 'loop-healthy', label: 'Loop healthy', ok: true }
    ],
    alarm: {
        state: 'UNACK',
        priority: 'HIGH',
        message: 'Phase 4 verification alarm',
        active: true,
        source: 'PID-101.PV'
    }
};
return msg;
`.trim()

const auditStoreFunction = `
global.set('${auditContextKey}', msg.payload);
msg.phase4 = {
    test: 'faceplate-write-audit',
    pass: msg.payload?.result === 'DENIED' && msg.payload?.reason === 'role-not-authorized',
    result: msg.payload?.result,
    reason: msg.payload?.reason,
    ts: new Date().toISOString()
};
node.status({
    fill: msg.phase4.pass ? 'green' : 'red',
    shape: msg.phase4.pass ? 'dot' : 'ring',
    text: msg.phase4.pass ? 'DENIED audit captured' : 'Unexpected audit result'
});
return msg;
`.trim()

const auditHttpFunction = `
msg.payload = global.get('${auditContextKey}') || null;
return msg;
`.trim()

const resetHttpFunction = `
global.set('${auditContextKey}', null);
msg.payload = { reset: true };
return msg;
`.trim()

const flow = {
  id: flowId,
  label: flowLabel,
  disabled: false,
  info: 'Phase 4 faceplate Dashboard 2.0 write-confirmation/RBAC test flow. Created by scripts/deploy-phase4-faceplate-tests.mjs without replacing existing flows.',
  nodes: [
    {
      id: injectId,
      type: 'inject',
      z: flowId,
      name: 'Seed PID state every 2s',
      props: [{ p: 'payload' }],
      repeat: '2',
      crontab: '',
      once: true,
      onceDelay: 0.5,
      topic: '',
      payload: '',
      payloadType: 'date',
      x: 150,
      y: 100,
      wires: [[stateId]],
    },
    {
      id: stateId,
      type: 'function',
      z: flowId,
      name: 'Phase 4 PID state',
      func: stateFunction,
      outputs: 1,
      timeout: 0,
      noerr: 0,
      initialize: '',
      finalize: '',
      libs: [],
      x: 360,
      y: 100,
      wires: [[faceplateId]],
    },
    {
      id: faceplateId,
      type: 'ui-scada-faceplate',
      z: flowId,
      name: 'PID-101 Faceplate',
      group: groupId,
      width: '4',
      height: '5',
      label: 'PID-101',
      template: 'pid',
      min: '0',
      max: '100',
      rateLimit: '20',
      ackRoles: 'operator, supervisor, engineer',
      shelveRoles: 'supervisor, engineer',
      oosRoles: 'engineer',
      shelveDurationMs: '1800000',
      includeClientData: true,
      x: 600,
      y: 100,
      wires: [[allowedDebugId], [auditStoreId]],
    },
    {
      id: allowedDebugId,
      type: 'debug',
      z: flowId,
      name: 'Allowed write/state',
      active: true,
      tosidebar: true,
      console: false,
      tostatus: false,
      complete: 'payload',
      targetType: 'msg',
      statusVal: '',
      statusType: 'auto',
      x: 860,
      y: 80,
      wires: [],
    },
    {
      id: auditStoreId,
      type: 'function',
      z: flowId,
      name: 'Store latest audit',
      func: auditStoreFunction,
      outputs: 1,
      timeout: 0,
      noerr: 0,
      initialize: '',
      finalize: '',
      libs: [],
      x: 850,
      y: 140,
      wires: [[auditDebugId]],
    },
    {
      id: auditDebugId,
      type: 'debug',
      z: flowId,
      name: 'Phase 4 audit status',
      active: true,
      tosidebar: true,
      console: false,
      tostatus: true,
      complete: 'phase4',
      targetType: 'msg',
      statusVal: 'phase4.pass',
      statusType: 'msg',
      x: 1090,
      y: 140,
      wires: [],
    },
    {
      id: auditHttpInId,
      type: 'http in',
      z: flowId,
      name: 'Get Phase 4 audit',
      url: '/scada-phase4-faceplate/audit',
      method: 'get',
      upload: false,
      swaggerDoc: '',
      x: 160,
      y: 240,
      wires: [[auditHttpFunctionId]],
    },
    {
      id: auditHttpFunctionId,
      type: 'function',
      z: flowId,
      name: 'Read latest audit',
      func: auditHttpFunction,
      outputs: 1,
      timeout: 0,
      noerr: 0,
      initialize: '',
      finalize: '',
      libs: [],
      x: 390,
      y: 240,
      wires: [[auditHttpResponseId]],
    },
    {
      id: auditHttpResponseId,
      type: 'http response',
      z: flowId,
      name: 'Return audit JSON',
      statusCode: '',
      headers: {},
      x: 620,
      y: 240,
      wires: [],
    },
    {
      id: resetHttpInId,
      type: 'http in',
      z: flowId,
      name: 'Reset Phase 4 audit',
      url: '/scada-phase4-faceplate/reset',
      method: 'post',
      upload: false,
      swaggerDoc: '',
      x: 170,
      y: 300,
      wires: [[resetHttpFunctionId]],
    },
    {
      id: resetHttpFunctionId,
      type: 'function',
      z: flowId,
      name: 'Clear latest audit',
      func: resetHttpFunction,
      outputs: 1,
      timeout: 0,
      noerr: 0,
      initialize: '',
      finalize: '',
      libs: [],
      x: 390,
      y: 300,
      wires: [[resetHttpResponseId]],
    },
    {
      id: resetHttpResponseId,
      type: 'http response',
      z: flowId,
      name: 'Return reset JSON',
      statusCode: '',
      headers: {},
      x: 620,
      y: 300,
      wires: [],
    },
  ],
  configs: [
    {
      id: baseId,
      type: 'ui-base',
      z: flowId,
      name: 'SCADA Phase 4 UI',
      path: '/scada-phase4',
      includeClientData: true,
      acceptsClientConfig: ['ui-notification', 'ui-control'],
      showPathInSidebar: false,
      navigationStyle: 'default',
      titleBarStyle: 'default',
    },
    {
      id: themeId,
      type: 'ui-theme',
      z: flowId,
      name: 'SCADA Phase 4 HP-HMI Theme',
      colors: {
        surface: '#f5f5f5',
        primary: '#546e7a',
        bgPage: '#eeeeee',
        groupBg: '#e0e0e0',
        groupOutline: '#bdbdbd',
      },
      sizes: {
        pagePadding: '12px',
        groupGap: '12px',
        groupBorderRadius: '4px',
        widgetGap: '6px',
      },
    },
    {
      id: pageId,
      type: 'ui-page',
      z: flowId,
      name: 'Phase 4 Faceplate',
      ui: baseId,
      path: '/faceplate',
      icon: 'mdi-tune-vertical',
      layout: 'grid',
      theme: themeId,
      breakpoints: [{ name: 'Default', px: '0', cols: '12' }],
      order: 3,
      className: '',
      visible: 'true',
      disabled: 'false',
    },
    {
      id: groupId,
      type: 'ui-group',
      z: flowId,
      name: 'Faceplate Write Test',
      page: pageId,
      width: '4',
      height: '5',
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
  console.log(`Updated existing Phase 4 faceplate test flow: ${existingFlow.id}`)
} else {
  await request('/flow', { method: 'POST', body: JSON.stringify(flow) })
  console.log(`Created Phase 4 faceplate test flow: ${flowId}`)
}

console.log(`Dashboard URL: ${adminBase.replace(/\/$/, '')}/scada-phase4/faceplate`)
