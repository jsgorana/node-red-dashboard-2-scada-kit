# Implementation Plan — Node-RED Dashboard 2.0 SCADA Kit

**GitHub repo:** `jsgorana/node-red-dashboard-2-scada-kit`  
**SRS source:** `compass_artifact_wf-8dd8b7d7…_text_markdown.md`  
**Reference module:** [`@jsgorana/node-red-opcua`](https://github.com/jsgorana/node-red-opcua) — follow its README style, docs/assets screenshot pattern, examples structure, and files allowlist exactly.

---

## Package Names & Naming Convention

Per Node-RED packaging docs (scoped names required post-Jan 2022):

| npm package | Node-RED node name | Description |
|---|---|---|
| `@jsgorana/node-red-dashboard-2-scada-core` | *(library, not a node)* | Shared DSL, sanitizer, alarm FSM |
| `@jsgorana/node-red-dashboard-2-scada-mimic` | `ui-scada-mimic` | SVG synoptic/mimic display |
| `@jsgorana/node-red-dashboard-2-scada-faceplate` | `ui-scada-faceplate` | Equipment popup panel |
| `@jsgorana/node-red-dashboard-2-scada-symbols` | *(library, not a node)* | HP-HMI SVG symbol catalog |

**Keywords every package must include:** `"node-red"`, `"node-red-dashboard"`, `"node-red-dashboard-2"`, `"scada"`, `"hmi"`, `"industrial"`  
*(Only add `"node-red"` keyword once stable and documented — per flows.nodered.org requirement)*

---

## Repository Structure

Modelled on `node-red-opcua` but extended for the Dashboard 2.0 build step:

```
node-red-dashboard-2-scada-kit/          ← GitHub repo root
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                       # lint + test + build on PR/push
│   │   └── release.yml                  # publish with OIDC provenance + SBOM on tag
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
│
├── packages/
│   ├── core/                            # @jsgorana/node-red-dashboard-2-scada-core
│   │   ├── src/
│   │   │   ├── dsl/
│   │   │   │   ├── parser.js            # ajv schema validation of binding JSON
│   │   │   │   └── evaluator.js         # transform pipeline: scale→valueMap→thresholds→format→quality
│   │   │   ├── sanitizer/
│   │   │   │   ├── server.js            # DOMPurify-over-jsdom, SVG profile, DTD disabled
│   │   │   │   └── client.js            # DOMPurify browser, same SVG profile + MutationObserver
│   │   │   ├── alarm/
│   │   │   │   └── fsm.js               # ISA-18.2 state machine (7 states, transitions)
│   │   │   ├── theme/
│   │   │   │   └── tokens.js            # CSS variable names + HP-HMI default values
│   │   │   └── index.js
│   │   ├── test/
│   │   │   ├── dsl.spec.js
│   │   │   ├── sanitizer.spec.js        # XSS corpus (≥20 malicious SVG payloads)
│   │   │   └── alarm.spec.js
│   │   ├── package.json
│   │   └── vite.config.js               # builds core.cjs.js + core.esm.js
│   │
│   ├── ui-mimic/                        # @jsgorana/node-red-dashboard-2-scada-mimic
│   │   ├── nodes/
│   │   │   ├── ui-scada-mimic.js        # server: createNode, group.register, sanitize, datastore
│   │   │   └── ui-scada-mimic.html      # editor: properties, DSL JSON editor, help panel
│   │   ├── ui/
│   │   │   ├── components/
│   │   │   │   └── UIScadaMimic.vue     # Options API; msg-input/widget-load; binding eval
│   │   │   └── index.js
│   │   ├── docs/assets/                 # screenshots for README (match opcua pattern)
│   │   ├── examples/                    # importable .json flows
│   │   ├── test/
│   │   │   ├── server_spec.js           # node-red-node-test-helper + mocha
│   │   │   └── UIScadaMimic.spec.js     # vitest + Vue Test Utils
│   │   ├── package.json
│   │   └── vite.config.js               # output: resources/ui-scada-mimic.umd.js
│   │
│   ├── ui-faceplate/                    # @jsgorana/node-red-dashboard-2-scada-faceplate
│   │   ├── nodes/
│   │   │   ├── ui-scada-faceplate.js
│   │   │   └── ui-scada-faceplate.html
│   │   ├── ui/
│   │   │   ├── components/
│   │   │   │   ├── UIScadaFaceplate.vue
│   │   │   │   ├── templates/
│   │   │   │   │   ├── MotorFaceplate.vue
│   │   │   │   │   ├── ValveFaceplate.vue
│   │   │   │   │   └── PIDFaceplate.vue
│   │   │   │   └── WriteConfirmDialog.vue
│   │   │   └── index.js
│   │   ├── docs/assets/
│   │   ├── examples/
│   │   ├── test/
│   │   ├── package.json
│   │   └── vite.config.js
│   │
│   └── symbols/                         # @jsgorana/node-red-dashboard-2-scada-symbols
│       ├── src/
│       │   ├── pump.svg
│       │   ├── motor.svg
│       │   ├── valve-gate.svg
│       │   ├── valve-ball.svg
│       │   ├── tank.svg
│       │   ├── conveyor.svg
│       │   ├── breaker.svg
│       │   ├── bargraph.svg
│       │   ├── multistate-indicator.svg
│       │   ├── mini-trend.svg
│       │   └── catalog.json
│       ├── index.js
│       ├── test/
│       ├── package.json
│       └── vite.config.js
│
├── examples/                            # root-level worked demo flows
│   └── tank-pump-motor-demo.json        # self-contained: simulated tags → ui-mimic → ui-faceplate
│
├── docs/
│   ├── dsl-reference.md                 # full binding DSL JSON schema + annotated examples
│   ├── symbol-catalog.md                # visual index with binding hooks per symbol
│   └── getting-started.md              # 30-minute tutorial
│
├── package.json                         # root (npm workspaces, shared devDeps)
├── .eslintrc.cjs
├── .prettierrc
├── .editorconfig
├── .gitignore
├── LICENSE                              # Apache-2.0
├── NOTICE
├── SECURITY.md
├── CONTRIBUTING.md
├── CHANGELOG.md
└── README.md
```

---

## Phase 0 — Repo & Monorepo Scaffold

### 0.1 GitHub repo
```bash
gh repo create jsgorana/node-red-dashboard-2-scada-kit \
  --public \
  --description "HP-HMI/SCADA widget kit for Node-RED Dashboard 2.0 — SVG mimics, faceplates, ISA-101 symbols" \
  --clone
cd node-red-dashboard-2-scada-kit
```

Set topics: `node-red node-red-dashboard scada hmi svg vue3 isa-101 industrial iiot`

Branch protection on `main`: require PR review, require CI checks (`lint`, `test`, `build`), no force-push.

### 0.2 Root `package.json`
```json
{
  "name": "node-red-dashboard-2-scada-kit",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "test":  "npm run test  --workspaces --if-present",
    "lint":  "eslint 'packages/*/src/**/*.{js,vue}' 'packages/*/nodes/**/*.js'",
    "clean": "rimraf packages/*/dist packages/*/resources"
  },
  "devDependencies": {
    "eslint": "^9",
    "@eslint/js": "^9",
    "eslint-plugin-vue": "^9",
    "prettier": "^3",
    "rimraf": "^5",
    "vite": "^5",
    "vitest": "^1",
    "@vue/test-utils": "^2",
    "mocha": "^10",
    "node-red-node-test-helper": "^0.3",
    "node-red": "^5.0.0",
    "should": "^13",
    "@playwright/test": "^1",
    "@cyclonedx/cyclonedx-npm": "^1"
  }
}
```

### 0.3 Per-package `package.json` template (ui-mimic example)
```json
{
  "name": "@jsgorana/node-red-dashboard-2-scada-mimic",
  "version": "0.1.0",
  "description": "SVG synoptic/mimic display node for Node-RED Dashboard 2.0 — declarative tag bindings, HP-HMI styling, ISA-101 compliant",
  "keywords": ["node-red", "node-red-dashboard", "node-red-dashboard-2", "scada", "hmi", "svg", "industrial", "iiot"],
  "license": "Apache-2.0",
  "author": "jsgorana <jsgorana@gmail.com>",
  "repository": { "type": "git", "url": "git+https://github.com/jsgorana/node-red-dashboard-2-scada-kit.git" },
  "bugs":     { "url": "https://github.com/jsgorana/node-red-dashboard-2-scada-kit/issues" },
  "homepage": "https://github.com/jsgorana/node-red-dashboard-2-scada-kit#readme",
  "engines":  { "node": ">=20.0.0" },
  "main": "nodes/ui-scada-mimic.js",
  "node-red": {
    "version": ">=4.0.0",
    "nodes": { "ui-scada-mimic": "nodes/ui-scada-mimic.js" }
  },
  "node-red-dashboard-2": {
    "version": ">=1.0.0",
    "widgets": {
      "ui-scada-mimic": {
        "output": "resources/ui-scada-mimic.umd.js",
        "component": "UIScadaMimic"
      }
    }
  },
  "files": ["nodes", "resources", "examples", "docs/assets", "README.md", "CHANGELOG.md", "LICENSE"],
  "scripts": {
    "build": "vite build",
    "test":  "mocha 'test/**/*_spec.js' --timeout 20000 && vitest run"
  }
}
```

**Acceptance criteria:** `npm install` resolves all workspaces; `npm run lint` clean across all packages.

---

## Phase 1 — Core Library

Build and fully test this first. It is the foundation and highest XSS risk surface.

### Key implementation notes

**DSL evaluator** — transform pipeline order (§3.4 of SRS, must not change):
`scale` → `valueMap` → `thresholds` → `format` → `default` → `quality override`

**Server sanitizer** (`sanitizer/server.js`):
```js
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

function sanitizeSVG(svg) {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject'],
    FORBID_ATTR: ['onload','onclick','onerror','onmouseover'],  // expand to all on*
  });
}
```
Also: strip `javascript:`/`data:` in href; disable XML DTD parsing.

**Alarm FSM states (ISA-18.2):** `NORMAL` → `UNACK` → `ACK` → `RTN_UNACK` → back to `NORMAL`.  
Plus out-of-band states: `SHELVED` (time-bounded), `SUPPRESSED_BY_DESIGN`, `OUT_OF_SERVICE`.

### Test commands
```bash
cd packages/core
npm run build    # vite build → dist/
npm test         # vitest --coverage
```

**Acceptance criteria:** ≥90% coverage on sanitizer & alarm FSM; all 20+ XSS corpus SVGs neutralized; DSL transform worked examples match SRS §3.4.

---

## Phase 2 — `ui-mimic`

### Node registration (`nodes/ui-scada-mimic.js`) skeleton
```js
module.exports = function(RED) {
  function UIScadaMimicNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const group = RED.nodes.getNode(config.group);
    if (!group) return;

    group.register(node, config, {
      onSocket: { /* custom events */ },
      beforeSend: (msg) => msg,
    });

    node.on('input', (msg) => {
      // sanitize SVG config (server-side) then save to datastore + forward
      base.stores.data.save(base, node, msg);
      node.send(msg);
    });
  }
  RED.nodes.registerType('ui-scada-mimic', UIScadaMimicNode);
};
```

### Vue component key rules (`UIScadaMimic.vue`)
- `inject: ['$dataTracker', '$socket']`
- Subscribe `msg-input:<id>` in `mounted`; unsubscribe in `unmounted`.
- **Never `v-html` untrusted SVG** — assign to `innerHTML` only after client sanitizer.
- Attach SVG click listeners via `addEventListener` (no inline `on*` handlers).

**Acceptance criteria:** all binding target types update on tag change; comm-loss timeout triggers gray; keyboard activation of clickable SVG elements works (WCAG 2.1.1).

---

## Phase 3 — Symbol Library

### HP-HMI SVG rules (enforced in source)
- Default fill: `var(--hmi-stopped)` (neutral gray).
- Running: `var(--hmi-running)` (different gray) + `RUNNING` text label.
- Alarm: `var(--hmi-alarm-high)` (red) + shape change (never color alone — ISA-101/WCAG 1.4.1).
- Each symbol's element IDs are documented in `catalog.json`.

**Acceptance criteria:** every symbol renders in Dashboard 2.0; deuteranopia color-blind simulation distinguishes all states; `catalog.json` IDs match actual SVG element IDs.

---

## Phase 4 — `ui-faceplate`

### RBAC + audit (server-side only, deny-by-default)
```js
const WRITE_ROLES = new Set(['operator', 'supervisor', 'engineer']);

node.on('input', (msg) => {
  const user = msg._client?.user;
  const allowed = user && WRITE_ROLES.has(user.role);
  const audit = { ts: Date.now(), user: user?.id, role: user?.role,
                  action: msg.topic, payload: msg.payload,
                  result: allowed ? 'ALLOWED' : 'DENIED' };
  node.send([allowed ? msg : null, { payload: audit }]); // pin 2 → historian
});
```

**Acceptance criteria:** unauthenticated Socket.IO `widget-action` write is blocked and audited; out-of-range SP rejected server-side; write-confirmation dialog precedes every control emit.

---

## Phase 5 — CI/CD

### `.github/workflows/ci.yml`
```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
```

### `.github/workflows/release.yml`
```yaml
name: Release
on:
  push:
    tags: ['packages/*/v*']   # e.g. packages/ui-mimic/v0.1.0
permissions:
  id-token: write
  contents: read
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', registry-url: 'https://registry.npmjs.org' }
      - run: npm ci && npm run build
      - run: npx @cyclonedx/cyclonedx-npm --output-file sbom.json
      - run: npm publish --workspaces --provenance --access public
        env: { NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }} }
```

---

## Phase 6 — Docker Local Testing Workflow

The local Node-RED Docker container is the primary test environment before any npm publish.

**Container:** `node-red` | Port: `http://localhost:1880` | Node.js: v24.16.0  
**Data volume:** `node-red-data` mounted at `/data` in container

### Install a package into the running container
```bash
# 1. Build the package
cd packages/ui-mimic && npm run build

# 2. Pack it
npm pack   # produces jsgorana-node-red-dashboard-2-scada-mimic-0.1.0.tgz

# 3. Copy to container data dir
docker cp jsgorana-node-red-dashboard-2-scada-mimic-0.1.0.tgz node-red:/data/

# 4. Install
docker exec node-red npm install --prefix /data /data/jsgorana-node-red-dashboard-2-scada-mimic-0.1.0.tgz

# 5. Restart Node-RED to load new node
docker restart node-red

# 6. Open browser
open http://localhost:1880
```

### Convenience script (save as `scripts/dev-install.sh`)
```bash
#!/bin/bash
# Usage: ./scripts/dev-install.sh ui-mimic
PKG=$1
cd "packages/$PKG" && npm run build && npm pack
TGZ=$(ls *.tgz | tail -1)
docker cp "$TGZ" node-red:/data/
docker exec node-red npm install --prefix /data "/data/$TGZ"
docker restart node-red
echo "Installed $TGZ — open http://localhost:1880"
```

### Remove a package from container
```bash
docker exec node-red npm uninstall --prefix /data @jsgorana/node-red-dashboard-2-scada-mimic
docker restart node-red
```

---

## Phase 7 — Docs & README Standards

Follow `@jsgorana/node-red-opcua` README pattern exactly:

1. **Header:** package name, one-sentence description, badge row (npm version, license, Node-RED compatibility)
2. **Screenshot/demo GIF** at top — saved to `docs/assets/`
3. **"What You Get" table** — node name | purpose
4. **Requirements** — Node.js version, Node-RED version, Dashboard 2.0 version
5. **Installation** — Palette Manager (with screenshot) + npm CLI
6. **Fastest Start** — self-contained demo flow with screenshots
7. **Example Flows** — each with screenshot + description
8. **Binding DSL reference** — link to `docs/dsl-reference.md`
9. **Symbol Catalog** — link to `docs/symbol-catalog.md`
10. **Contributing / Security** — link to `CONTRIBUTING.md`, `SECURITY.md`

Screenshots go in `docs/assets/` and are committed to the repo (GitHub raw URL in README).

---

## Phase 8 — flows.nodered.org Submission Checklist

*Only submit once the package is stable and documented.*

- [ ] `"node-red"` in keywords
- [ ] `"node-red-dashboard-2"` in keywords
- [ ] `node-red.version` set (e.g. `">=4.0.0"`)
- [ ] `node-red.nodes` maps every node name to its `.js` file
- [ ] `node-red-dashboard-2.widgets` section present with `output` + `component`
- [ ] README.md complete with screenshots
- [ ] LICENSE file (Apache-2.0)
- [ ] `examples/` folder at package root
- [ ] Published to npm with provenance
- [ ] Submit at https://flows.nodered.org (manual — no longer auto-indexed)
- [ ] Request refresh for subsequent version updates

---

## Pre-release Checklist (before v1.0.0 tag)

- [ ] `npm audit` — zero high/critical findings
- [ ] XSS corpus: all 20+ payloads neutralized
- [ ] WCAG: axe-core pass + manual keyboard/contrast/color-blind check
- [ ] Load test: 500 tags @ 10 Hz, p95 update latency ≤ 250 ms
- [ ] 24-hour soak: no memory growth >5%
- [ ] Unauthenticated write pen-test: blocked + audited
- [ ] `npm publish --dry-run` for each package — verify `files` allowlist
- [ ] CycloneDX SBOM generated and attached to GitHub release
- [ ] Docker local test: all 3 node types install cleanly and render in Dashboard 2.0

---

## Phased Summary

| Phase | Deliverable | Acceptance gate |
|-------|-------------|-----------------|
| 0 | Repo + monorepo scaffold | `npm install` + lint clean |
| 1 | `core` library | XSS corpus green, ≥90% coverage |
| 2 | `ui-mimic` | All binding targets work, Docker install & render |
| 3 | `symbols` | Catalog complete, a11y color-blind check |
| 4 | `ui-faceplate` | RBAC + audit, templates functional in Docker |
| 5 | CI/CD | Green pipeline, SBOM on tag |
| 6 | Docker testing | All packages installed in container, demo flow imports |
| 7 | Docs + README | Matches opcua module quality: screenshots, examples |
| 8 | flows.nodered.org | Submitted, visible in library |
