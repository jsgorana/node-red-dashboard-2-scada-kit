# SCADA Kit — Session Progress Log

**Project:** Node-RED Dashboard 2.0 SCADA Kit  
**GitHub repo (to create):** `jsgorana/node-red-dashboard-2-scada-kit`  
**SRS:** `compass_artifact_wf-8dd8b7d7-3f7d-41d4-bba6-e9318e45cf3c_text_markdown.md` (in same folder)  
**Full plan:** `IMPLEMENTATION_PLAN.md` (in this folder)

---

## Environment

| Item | Detail |
|------|--------|
| Docker Node-RED | Container `node-red`, port `http://localhost:1880`, Node.js v24.16.0 |
| Data volume | `node-red-data` → `/data` in container |
| Install pattern | `npm pack` → `docker cp` → `docker exec npm install --prefix /data` → `docker restart node-red` |
| Reference module | [`@jsgorana/node-red-opcua`](https://github.com/jsgorana/node-red-opcua) — mirror its README/docs quality |
| Git identity | `jsgorana` / `jsgorana@gmail.com` |

---

## Phase Status

| Phase | Status | Notes |
|-------|--------|-------|
| 0 — Repo & scaffold | ✅ Complete | GitHub repo live, all package stubs committed |
| 1 — Core library | ✅ Complete | 69/69 tests passing — XSS corpus, DSL pipeline, alarm FSM |
| 2 — ui-mimic | ✅ Complete | UMD built (154 kB), installed in Docker, demo flow live at http://localhost:1880/scada/demo |
| 3 — symbols | ✅ Complete | Catalog/tests + Docker Dashboard gallery + sizing/theme/deuteranopia verification |
| 4 — ui-faceplate | ✅ Complete | RBAC + write-confirm dialog + Motor/Valve/PID templates; 9/9 tests; live verifier at /scada/faceplate green. Example auth flows + screenshots = Phase 7 polish |
| 5 — CI/CD | ✅ Complete | ci.yml + release.yml committed with Phase 0 |
| 6 — Docker local testing | ✅ Complete | Both packages installed; demo tab added via POST /flow — existing tabs untouched |
| 7 — Docs & README | ✅ Complete | Screenshots, Examples, importable flows, binding-DSL reference + getting-started tutorial all shipped; all relative doc links verified |
| 8 — flows.nodered.org | 🔄 Ready | Pre-flight complete + verified; runbook in docs/publishing.md. Awaiting user npm publish (credentials) + flow-library submission |

---

## Session Log

### Session 1 — 2026-06-30
**Done:**
- Read and understood full SRS (`compass_artifact_wf…`)
- Fetched flows.nodered.org naming/packaging requirements
- Fetched nodered.org/docs/creating-nodes/packaging
- Reviewed `@jsgorana/node-red-opcua` structure as quality reference
- Confirmed Docker `node-red` container (port 1880, Node.js v24, data volume `/data`)
- Established correct scoped package names: `@jsgorana/node-red-dashboard-2-scada-*`
- **Phase 0 complete:** GitHub repo created and pushed — https://github.com/jsgorana/node-red-dashboard-2-scada-kit
  - All 4 package stubs with correct `package.json` (node-red + node-red-dashboard-2 sections)
  - Vite UMD build configs for ui-mimic and ui-faceplate
  - CI + release workflows, Dependabot
  - Apache-2.0 LICENSE + NOTICE (full acknowledgements: FlowFuse, node-red-contrib-ui-svg, DOMPurify, Vue, Vite, standards)
  - CONTRIBUTING.md (DCO), SECURITY.md, CHANGELOG.md
  - `scripts/dev-install.sh` Docker test script
  - README.md scaffold with standards compliance table and acknowledgements
- Memory + PROGRESS.md updated

**Next session should start with:**
1. `cd '/Users/boss/Documents/Github Projects/scada-kit-nrd2'`
2. Read `PROGRESS.md` — then begin **Phase 3: symbols library**
3. `packages/symbols/` — SVG symbol library for tanks, pumps, valves, motors, pipes
4. Each symbol as its own optimised `.svg` file + JS barrel export
5. Server test + README with visual gallery
6. Demo flow at http://localhost:1880/scada/demo — open in browser to validate mimic renders (inject every 2s, tank level oscillates, pump colour changes)

### Session 2 — 2026-06-30
**Done:**
- **Phase 1 fixes:** converted core DSL/FSM/theme modules from CJS to ESM — fixes Rollup named-export resolution at runtime
- **Phase 2 complete:**
  - `packages/ui-mimic` fully built — `resources/ui-scada-mimic.umd.js` (154 kB gzip 50 kB)
  - `exports: 'named'` added to Vite config (silences UMD warning)
  - Both packages (`core` + `ui-mimic`) packed and installed in Docker
  - `ui-scada-mimic` node registered and enabled (confirmed via `/nodes` API)
  - Demo flow tab "SCADA Kit — Demo" added via `POST /flow` (id: `b6b4838a289be1c0`)
  - Dashboard live at `http://localhost:1880/scada/demo`
  - Inject every 2 s → function node → ui-scada-mimic → tank SVG with level + pump colour bindings
  - All 69 core tests still green
- **Phase 2 rendering verified in browser** (screenshot confirmed): tank fills bottom-up live, pump turns blue + RUNNING + amps when running. Four runtime bugs found and fixed:
  1. `output` path must be bare filename (`ui-scada-mimic.umd.js`) — Node-RED `/resources/<pkg>/` already roots at the package `resources/` dir; double `resources/` → 404
  2. Vite lib `name` must equal the **widget key** (`ui-scada-mimic`), not the component name — Dashboard loads `window[widgetName][componentName]`
  3. Vite global for vuex must be lowercase `vuex` (Dashboard exposes `window.vuex`, not `window.Vuex`) — mismatch threw at module load and silently killed the widget (blank page)
  4. `level` target type now sets SVG rect `height`+`y` attributes (caches original y in `data-y0`), not CSS height — CSS height does nothing on `<rect>`
- **Editor `Set widget size` button:** wired `elementSizer` in `oneditprepare` (was greyed out) — copied Dashboard's own subflow-aware pattern
- **SVG sizing:** container uses "contain" CSS (`max-width/height:100%; width/height:auto`) so SVG scales within the grid cell on both axes — fixes oversizing where `height:auto` ignored cell height
- **CRITICAL CSS fix (verified with headless Chromium screenshots):** Vite extracted component `<style>` into a separate `style.css` that Dashboard NEVER loads → scoped styles were never applied (SVG stayed `position:static`, sized by width×aspect-ratio, overflowed its box → the "unpredictable sizing"). Fix: added `vite-plugin-css-injected-by-js` to inline CSS into the UMD. Then made content out-of-flow (`position:absolute; inset:0` on root + svg) so the widget locks to `heightRows×48px` and the SVG letterbox-contains. Tested matrix of widget sizes via Puppeteer in the container (CDP `Network.setBypassServiceWorker` to defeat the PWA cache): svg height now == widget box height in every case.
- **Sizing model (now deterministic):** widget height = heightRows × 48px; widget width = `span min(widgetWidth, groupColumns)` of the group; SVG always letterbox-centered inside. See [[dashboard2-widget-gotchas]].

### Session 3 — 2026-06-30
**Done:**
- **Phase 3 started:**
  - Added 11 hand-authored HP-HMI SVG symbols under `packages/symbols/src/`:
    - `pump`, `motor`, `valve-gate`, `valve-ball`, `tank`, `conveyor`, `breaker`, `bargraph`, `multistate-indicator`, `mini-trend`, `pipe`
  - Added `packages/symbols/src/catalog.json` with stable bindable element IDs and binding hook metadata
  - Added `packages/symbols/index.js` CommonJS barrel export:
    - `catalog`
    - `symbols`
    - `getSymbol(id)`
  - Added `packages/symbols/test/catalog.spec.js`
    - validates catalog IDs against actual SVG IDs
    - validates exported SVG text
    - validates HP-HMI tokens (`--hmi-stopped`, `--hmi-running`, `--hmi-alarm-high`)
    - validates non-color alarm affordances and accessible SVG names/descriptions
  - Added `packages/symbols/README.md`
  - Added root `docs/symbol-catalog.md`
- Verification:
  - `npm test --workspace @jsgorana/node-red-dashboard-2-scada-symbols` → 5/5 passing
  - `npm pack --workspace @jsgorana/node-red-dashboard-2-scada-symbols --dry-run` → package contents verified
  - `node -e "require('./packages/symbols')..."` → exports verified
  - Fixed previous workspace blockers:
    - added ESLint 9 flat config (`eslint.config.js`)
    - added optional test runner for UI packages with no tests yet (`scripts/run-optional-tests.mjs`)
    - added minimal Phase 4 placeholder `UIScadaFaceplate` UI entry so workspace build stays green before full faceplate implementation
  - `npm run lint` → clean
  - `npm run build --workspaces --if-present` → clean
  - `npm test` → clean (`core` 69/69, `symbols` 5/5; UI packages currently skip because no tests exist yet)
  - Fixed remaining cleanup items:
    - removed root `node-red` dev dependency from the install tree; Docker remains the Node-RED runtime test target
    - replaced Mocha with Vitest for core tests to remove vulnerable Mocha transitive dependencies
    - upgraded direct dev tools (`vite`, `vitest`, `@cyclonedx/cyclonedx-npm`)
    - marked `packages/core` as ESM and renamed the Node-RED/CommonJS wrapper to `src/index.cjs`
    - converted server sanitizer and core tests to ESM
  - Final verification:
    - `npm audit` → 0 vulnerabilities
    - `npm run lint` → clean
    - `npm run build --workspaces --if-present` → clean
    - `npm test` → clean (`core` 69/69, `symbols` 5/5)
    - CommonJS `require('@jsgorana/node-red-dashboard-2-scada-core')` and ESM `import` both verified

**Phase 3 gate:** complete. Symbol package tests, Docker Dashboard render, sizing/theme checks, and deuteranopia verification are now repeatable.

**Docker Phase 3 test setup:**
- Added `scripts/deploy-phase3-symbol-tests.mjs`
  - Generates a Dashboard 2.0 symbol gallery SVG from `packages/symbols/src/catalog.json`
  - Creates/updates only the flow labelled `SCADA Kit — Phase 3 Symbols`
  - Does not replace the full Node-RED flows array
  - Reuses existing Dashboard base/theme (`/scada`) and adds page `/symbols`
- Installed current local tarballs into Docker `/data`:
  - `@jsgorana/node-red-dashboard-2-scada-core`
  - `@jsgorana/node-red-dashboard-2-scada-symbols`
  - `@jsgorana/node-red-dashboard-2-scada-mimic`
- Created live flow tab in Docker Node-RED:
  - Label: `SCADA Kit — Phase 3 Symbols`
  - Node-RED-assigned id: `0f4b2de6ca3a9671`
  - Dashboard URL: `http://localhost:1880/scada/symbols`
  - Existing tabs preserved: 7 tabs total after append
- Browser verification:
  - `cellCount = 11`
  - `passCount = 11`
  - summary text: `PASS 11/11 symbols`
  - symbol cell geometry verified after CSS fix
- Phase 3 sizing fix:
  - Live flow had drifted to `width: "0", height: "0"` on the `ui-scada-mimic` node, unlike the Phase 2 demo's explicit `width/height`
  - `scripts/deploy-phase3-symbol-tests.mjs` now forces `width: "12", height: "10"` on both the group/widget test geometry
  - Gallery viewBox changed from narrow `720 × 470` to wide `1440 × 640`, matching the full-width Dashboard widget much more closely
  - Nested symbol `<svg>` wrappers were replaced with scaled `<g>` transforms so only the top-level mimic SVG participates in Dashboard sizing
  - Top-level SVG uses `preserveAspectRatio="xMidYMin meet"` to mimic the deterministic contain behavior from the Phase 2 demo while top-aligning content
  - Browser geometry after redeploy: root/widget `1207 × 534`, cells consistently about `175 × 207`, `PASS 11/11`
- Documentation and repeatable verification:
  - Added `docs/phase3-docker-symbol-tests.md`
  - Linked it from `docs/symbol-catalog.md`
  - Added root scripts:
    - `npm run phase3:deploy`
    - `npm run phase3:verify`
  - Added `scripts/verify-phase3-symbol-tests.mjs`
    - Opens the live Docker Dashboard page with Playwright
    - Falls back to system Chrome if the Playwright-managed browser is not installed
    - Checks widget/root SVG geometry, fixed viewBox, no nested SVG wrappers, 11 rendered cells, 11 PASS labels, RGB paint resolution, and deuteranopia color-distance sanity
  - `npm run phase3:verify` → clean (`PASS 11/11`, root/widget `1382 × 534`, cells `175 × 207`, deuteranopia distances running/stopped `106`, alarm/stopped `62`)
- Found and fixed a Phase 2/3 interaction bug:
  - `ui-mimic` scoped CSS was targeting every descendant `svg`, which distorted nested symbol SVGs
  - narrowed selector to top-level `svg` only in `UIScadaMimic.vue`
- Verification after setup:
  - `npm run lint` → clean
  - `npm run build --workspaces --if-present` → clean
  - `npm test` → clean

### Session 4 — 2026-06-30
**Done:**
- Documented Phase 3 Docker symbol tests:
  - `docs/phase3-docker-symbol-tests.md`
  - linked from `docs/symbol-catalog.md`
  - root scripts: `phase3:deploy`, `phase3:verify`
- Added live Dashboard verifier:
  - `scripts/verify-phase3-symbol-tests.mjs`
  - checks Dashboard geometry, fixed viewBox, no nested SVG wrappers, PASS labels, RGB paint resolution, and deuteranopia color-distance sanity
  - falls back to system Chrome if Playwright-managed Chromium is not installed
- **Phase 3 marked complete**
- **Phase 4 started:** faceplate server RBAC/audit first slice
  - `packages/ui-faceplate/nodes/rbac.js`
    - deny-by-default
    - allowed roles: `operator`, `supervisor`, `engineer`
    - min/max setpoint enforcement
    - audit payloads for allowed and denied writes
  - `packages/ui-faceplate/nodes/ui-scada-faceplate.js`
    - Node-RED Dashboard node registration
    - two outputs: allowed write/state, audit
    - `widget-action` writes gated through RBAC helper
  - `packages/ui-faceplate/nodes/ui-scada-faceplate.html`
    - editor shell with group, size, label, min/max SP fields
  - `packages/ui-faceplate/test/rbac.spec.js`
    - unauthenticated denied
    - unauthorized role denied
    - operator allowed in range
    - below-min rejected
    - above-max rejected
- Verification:
  - `npm run phase3:verify` → clean
  - `npm run lint` → clean
  - `npm run build --workspaces --if-present` → clean
  - `npm test` → clean (`core` 69/69, `symbols` 5/5, `ui-faceplate` 5/5)
  - `npm audit` → 0 vulnerabilities

**Next Phase 4 steps:**
- Add example flows for authorized operator/supervisor/engineer writes once Dashboard auth mapping is configured
- Expand faceplate docs with template screenshots and downstream PLC-write wiring patterns
- Add release-facing README screenshots after visual polish

**Phase 4 continuation — Docker faceplate tests:**
- Added client-side write confirmation dialog before any Dashboard `widget-action` emit
- Added Motor / Valve / PID faceplate templates
- Added editor/runtime template config for `ui-scada-faceplate`
- Forced `includeClientData` on the faceplate node so Dashboard attaches socket metadata to browser-originated writes
- Fixed Dashboard action emit signature:
  - incorrect: single object payload
  - correct: `widget-action`, `widgetId`, `msg`
- Preserved operator intent in `msg.action` because Dashboard normalizes `msg.topic` before the server `beforeSend` hook
- Added repeatable Docker flow tooling:
  - `scripts/deploy-phase4-faceplate-tests.mjs`
  - root script `npm run phase4:deploy`
  - creates/updates only `SCADA Kit — Phase 4 Faceplate`
  - live page: `http://localhost:1880/scada/faceplate`
  - flow id in Docker: `7ff6f60c33d3c2e1`
- Added live verifier:
  - `scripts/verify-phase4-faceplate-tests.mjs`
  - root script `npm run phase4:verify`
  - resets audit state
  - verifies no audit is emitted before confirmation
  - confirms a PID setpoint write
  - verifies unauthenticated browser write is denied and audited as `pid.setpoint`
  - checks faceplate/widget geometry stays bounded
- Added docs:
  - `docs/phase4-docker-faceplate-tests.md`
- Installed local faceplate tarball in Docker `/data` without replacing existing flows
- Verification:
  - `npm run phase4:verify` → clean
  - audit result: `DENIED`, reason: `role-not-authorized`, action: `pid.setpoint`, setpoint: `62.5`
  - `npm run lint` → clean
  - `npm run build --workspaces --if-present` → clean
  - `npm test` → clean (`core` 69/69, `symbols` 5/5, `ui-faceplate` 9/9; `ui-mimic` no tests yet)
  - `npm audit` → 0 vulnerabilities
  - Docker `/data` still reports 4 high vulnerabilities from unrelated installed contrib packages; repo audit remains clean

### Session 5 — 2026-06-30 (Phase 7 — README screenshots)
**Done:**
- Captured live Dashboard 2.0 screenshots headlessly inside Docker (`scripts/capture-screenshots.cjs`, puppeteer + chromium, CDP `Network.setBypassServiceWorker` to defeat the PWA cache). Pages: `/scada/demo`, `/scada/symbols`, `/scada/faceplate`.
- Placed in `docs/assets/{mimic,symbols,faceplate}.png` and per-package `packages/ui-{mimic,faceplate}/docs/assets/`.
- README: replaced stale "Phase 0 scaffold" status banner; added **Screenshots** section embedding all three with descriptive alt text.
- **Two real bugs found by actually looking at the captures** (mimic + faceplate were clean; symbol gallery was not):
  1. **Symbol status text was garbled/illegible** ("RUNNINRNNING") — every `<text>` in the symbol SVGs is a child of the symbol's `<g stroke=... stroke-width="3">` and did not override stroke, so glyphs were painted with a 3px stroke and bled together. Fix: added `stroke="none"` to all `<text>` elements across the 11 symbol SVGs. (breaker had one already fixed — its label was the only legible one, which confirmed the cause.)
  2. **Tank/mini-trend/bargraph/multistate showed two overlapping labels** — the Phase 3 gallery harness (`deploy-phase3-symbol-tests.mjs`) bound *every* `text` hook, including `*-value-text`, to the status string `symbols.<id>.label`. So a numeric value slot and the status slot both showed "RUNNING". Fix: route `*-value-text` targets to the numeric `symbols.<id>.value` with `format:{decimals:0,suffix:'%'}`, leaving `*-status-text`/`*-state-text` on the label. Now Tank shows `3%` + `RUNNING`, Multistate `STOPPED` + `39%`, etc.
- Quality gate after fixes: `npm run lint` clean; `npm test` → core 69, symbols 5, faceplate 9 (83 total) all green.

**Lesson learnt (recorded in memory):** SVG `<text>` inside a stroked `<g>` inherits the stroke and renders as an unreadable bold smear — always set `stroke="none"` (or `fill`-only) on text inside grouped, stroked symbols. See [[dashboard2-widget-gotchas]].

**Next:** example flow JSONs (operator/supervisor/engineer authorized faceplate writes once Dashboard auth is mapped); then Phase 8 (flows.nodered.org submission).

### Session 6 — 2026-06-30 (Phase 7 — importable example flows)
**Done:**
- Shipped two self-contained, importable example flows, **exported from the live verified Docker flows** (known-good, not hand-written):
  - `packages/ui-mimic/examples/mimic-tank-pump.json` — Demo tab as-is (inject → function → ui-scada-mimic + bundled base/theme/page/group). 9 nodes.
  - `packages/ui-faceplate/examples/faceplate-pid-rbac.json` — Phase 4 faceplate tab with the 6 HTTP audit-endpoint test nodes + audit-store stripped; faceplate audit output rewired straight to a debug; shared ui-base/ui-theme cloned in so it imports standalone. 10 nodes.
- Both files: valid JSON, all internal refs (widget→group→page→base, wires) resolve, and they live where Node-RED's **Import → Examples → _package_** menu auto-discovers them. `files` allowlist already includes `examples/`; confirmed both appear in `npm pack --dry-run`.
- README: added an **Examples** table + updated the repo-structure block to show per-package `examples/`; removed the now-unused empty top-level `examples/` dir.
- Quality gate: `npm run lint` clean; `npm test` → 83 green (core 69, symbols 5, faceplate 9).

**Phase 7 remaining (lower priority):** binding-DSL reference doc + getting-started tutorial under `docs/`. Note: a *fully authorized* faceplate write example needs Dashboard authentication mapped first — the shipped example demonstrates the wiring and the deny-by-default gate (unauthenticated writes are denied + audited).

**Next:** Phase 8 (flows.nodered.org submission) once docs are rounded out.

### Session 7 — 2026-07-01 (Phase 7 — DSL reference + getting-started; Phase 7 complete)
**Done:**
- `docs/binding-dsl.md` — full reference grounded in the actual source: the tag-map input shape; binding object fields; all 6 target types (text/attribute/style/visibility/level/transform) with their real `applyToElement` behavior; the **fixed transform-pipeline order** (scale → valueMap → thresholds → format → default → quality) straight from `evaluator.js`; quality/comm-loss degradation; events/write-back; a worked example copied verbatim from the shipped mimic example. Includes the `<text>`-stroke gotcha.
- `docs/getting-started.md` — install (palette/npm/Docker) → import the example → author an SVG with ids → configure the node → write bindings → feed a tag map → add a faceplate (RBAC) → use the symbol library.
- README: added a **Documentation** section linking getting-started, binding-DSL, symbol-catalog.
- Verified every relative markdown link across README + new docs resolves on disk.
- **Phase 7 marked complete.**

**Observation (flagged for follow-up, not changed):** `ui-scada-mimic`'s `attachEventListeners` emits `socket.emit('widget-action', { widgetId, msg })` (single object), whereas the verified-working faceplate uses the positional `socket.emit('widget-action', widgetId, msg)` signature (see [[dashboard2-faceplate-write-rbac]]). Mimic `events` write-back may not deliver — needs a live click test. The DSL docs describe the event *config* contract only, so they remain correct regardless.

**Next:** Phase 8 — flows.nodered.org submission (package is feature-complete + documented).

### Session 8 — 2026-07-01 (Phase 8 — publish pre-flight)
**Done — packages are publish-ready and verified:**
- Audited all 4 `package.json`: complete metadata (name/version/desc/license/author/repository+directory/bugs/homepage/keywords/engines). All `private:false`, all keywords include `node-red`/`node-red-dashboard`/`node-red-dashboard-2`.
- Added `publishConfig.access:"public"` to all 4 (scoped packages publish privately by default; the release workflow already passed `--access public`, this is a manual-publish safety net). Note: the re-stringify expanded some compact arrays — cosmetic only.
- **Fixed a real publishing gap:** only `symbols` had a README and *none* of the packages carried LICENSE/NOTICE. Copied root `LICENSE`+`NOTICE` into all 4 (Apache-2.0 requires them in each artifact) and wrote focused per-package `README.md` for core, ui-mimic, ui-faceplate (npmjs renders these). Confirmed all now appear in the tarballs via `npm pack --dry-run`.
- Verified `npm publish --dry-run --workspaces --access public` is clean for all 4. Tarball sizes: core 11kB, symbols 11kB, faceplate 32kB, mimic 78kB (incl. 150kB UMD).
- Confirmed dependency/publish order: ui-mimic + ui-faceplate depend on `core` at runtime (mimic requires it server-side); `--workspaces` publish handles it, manual must do core first. symbols is standalone.
- Confirmed `.github/workflows/release.yml` fires on `v*` tag → build, test, SBOM, `npm publish --workspaces --provenance --access public` with `secrets.NPM_TOKEN`.
- Wrote `docs/publishing.md` — full runbook: pre-flight checklist, automated (tag) vs manual publish, npm verification, and the flows.nodered.org "add → node" submission steps (only the 2 widget packages get listed).
- Quality gate: `npm run lint` clean; `npm test` → 83 green; versions all 0.1.0.

**Blocked on user (cannot be done by assistant — credentials + irreversible public actions):**
1. Create npm automation token + set GitHub `NPM_TOKEN` secret.
2. Commit/push working tree, then `git tag v0.1.0 && git push origin v0.1.0` (or manual `npm publish`).
3. Sign in to flows.nodered.org and add the two widget packages.

### Session 11 — 2026-07-01 (SRS gap-close, security hardening, quality polish)
**Done — full SRS review against the original spec; all identified gaps closed:**

**Critical bugs fixed:**
- `UIScadaMimic.vue` `attachEventListeners`: wrong emit signature `socket.emit('widget-action', { widgetId, msg })` → correct positional form `socket.emit('widget-action', this.id, { topic, payload })`. SVG click events now deliver to the node's `onAction` handler (was silently dropped before).
- `UIScadaMimic.vue` `mutationGuard`: declared in `data()` but never connected. Now wired up in `mounted()` via `createMutationGuard(container)` from `lib/client.js` (satisfies SRS §8.1 MutationObserver re-sanitization requirement).
- `UIScadaFaceplate.vue`: Vue component had no `$dataTracker` subscription — PV/SP/mode only showed the initial static `props`, never updated live. Added `$dataTracker` injection and `created()` subscription; all computed values now merge from `liveState` (updated on every incoming msg) over the static `props`.

**Security hardening (SRS §8.1, IEC 62443-4-2 CR 7.1):**
- `lib/sanitizer/server.js` + `lib/sanitizer/client.js`: replaced explicit `FORBID_ATTR` list (missed SVG animation events: `onbegin`, `onend`, `onrepeat`) with a `DOMPurify.addHook('uponSanitizeAttribute')` that strips **any attribute starting with `on`** — exhaustive, future-proof. Added `ALLOWED_URI_REGEXP` to block `javascript:`/`data:` URIs in ALL attributes (not just href with a post-hoc regex). Added `FORCE_BODY: true`. Removed the brittle `DANGEROUS_HREF_RE` post-processing regex. Added JSDoc comment explaining DTD/DOCTYPE protection via jsdom default.

**SRS §3.3 compliance — `msg.topic` scalar input:**
- `nodes/ui-scada-mimic.js` `onInput`: now normalizes `{ topic: "P101.run", payload: true }` → `{ payload: { "P101.run": true } }` before forwarding to Dashboard (single-tag update pattern documented in SRS §3.3).

**Configurable RBAC roles (SRS §8.5):**
- `nodes/rbac.js`: added `getAllowedRoles(config)` — reads `config.allowRoles` (comma-separated string from editor); falls back to `DEFAULT_WRITE_ROLES`. Roles are now configurable per-node, not hardcoded.
- `nodes/ui-scada-faceplate.html`: added **Allow roles** field to editor template (with `allowRoles` default); default description shown inline.

**WCAG / ARIA improvements (SRS NFR-A11Y-01):**
- `UIScadaFaceplate.vue`: `aria-live="polite" aria-atomic="true"` on status label so screen readers announce state changes; `aria-label` on PV/SP/Mode `<dd>` cells; dynamic `stateClass` colors status badge by state (running=blue, stopped=gray, alarm=red); button `min-height` raised to `44px` (WCAG 2.5.8 Target Size Min); `focus-visible` outline on buttons and inputs.

**Professional node help panels (SRS §12):**
- `nodes/ui-scada-mimic.html`: complete rewrite of the `data-help-name` panel — structured sections: overview, inputs (both flat + structured tag map + topic scalar), outputs, configuration, binding DSL (worked example, target-types table, transform-pipeline ordered list), HP-HMI theme tokens table (with fallback-value gotcha), security bullet list (dual-layer sanitization, MutationObserver, CSP compatibility), references.
- `nodes/ui-scada-faceplate.html`: complete rewrite — overview, inputs (all payload fields), outputs (both numbered with audit record format in `<pre>`), configuration (all fields including allowRoles), RBAC + security model, wiring guide with snippet, compliance notes (IEC 62443 CRs), references. Also added inline live JSON validation to the bindings textarea (formats JSON on blur, shows error hint).

**Example flows polish (SRS §12 — worked examples):**
- `mimic-tank-pump.json`: upgraded tab `info` to full markdown tutorial; added proper `info` annotations to Tag simulator and Debug nodes; SVG comments clarified (stroke=none note); bindings JSON pretty-printed.
- `faceplate-pid-rbac.json`: removed all "Phase 4" internal naming; renamed to `TIC-101`; added full markdown tutorial in tab `info` including RBAC development tip; all debug nodes annotated with their purpose and production wiring guidance. Added `allowRoles` field.

**Quality gates:**
- `npm run lint` → clean (0 errors)
- `npm test` → 83/83 pass
- `npm run build` → both UMDs clean (mimic 150.63 kB, faceplate 12.85 kB)
- Docker install verified → both nodes enabled v0.1.0; all three dashboard pages render; fresh screenshots captured.

**Remaining for Phase 8 (unchanged — requires user credentials):**
1. Commit/push full tree to `main`
2. `git tag v0.1.0 && git push origin v0.1.0` (triggers CI publish with provenance + SBOM)
3. flows.nodered.org submission (one listing for `@jsgorana/node-red-dashboard-2-scada`)

### Session 10 — 2026-07-01 (merge to a single package)
**Done — consolidated the 4 packages into ONE publishable package** `@jsgorana/node-red-dashboard-2-scada` at `packages/scada/`, per user request ("don't publish two separate packages; combine into 1" → chose "everything in one package"):
- New layout: `lib/` (former `core` — ESM, kept ESM via its own `lib/package.json` `{"type":"module"}` under the CJS root so Node-RED node files stay CommonJS), `nodes/` (both nodes + rbac.js), `ui/mimic/` + `ui/faceplate/`, `symbols/`, `resources/` (both UMDs), `examples/` (both flows), `docs/assets/`, `test/`.
- Import rewires: mimic node `require('../lib/index.cjs')`; mimic Vue `import ... from '../../../lib/client.js'`; tests `../src`→`../lib`, faceplate spec ui path, symbols spec `require('../symbols')`.
- Build: two Vite configs (`vite.mimic.mjs`, `vite.faceplate.mjs`) both → `resources/` with `emptyOutDir:false` (else the second build wipes the first); `vite.config.mjs` (vue plugin) is what Vitest loads to transform `.vue` specs. `build` script `rimraf resources && vite build -c … && vite build -c …`.
- package.json: `node-red.nodes` = both nodes; `node-red-dashboard-2.widgets` = both; deps ajv/dompurify/jsdom/sanitize-html (from core); `exports: { "./symbols": "./symbols/index.js" }`; merged keywords; publishConfig public; README+LICENSE+NOTICE+CHANGELOG bundled (46 files, 121kB tarball).
- Removed `packages/{core,ui-mimic,ui-faceplate,symbols}`. Updated root `lint` glob, `dev-install.sh` (defaults to `scada`), `deploy-phase3` symbol path, and all docs (README, getting-started, binding-dsl, symbol-catalog, publishing) to the single package.
- **Verified end-to-end:** lint clean, both UMDs build, 83 tests pass; in Docker uninstalled the 3 old pkgs, installed the single tarball, restarted — `/nodes` shows one module `@jsgorana/node-red-dashboard-2-scada` registering both `ui-scada-mimic` + `ui-scada-faceplate`; both pages render live (mimic tank/pump, faceplate PID).

### Session 9 — 2026-07-01 (palette category fix)
**Done:**
- **Fixed palette grouping:** both nodes hardcoded `category: 'dashboard 2.0'`, which Node-RED rendered as a *separate* "dashboard 2 0" group — NOT merged with the FlowFuse stock widgets (which sit under "dashboard 2"). Changed both `ui-scada-mimic.html` / `ui-scada-faceplate.html` to `category: RED._('@flowfuse/node-red-dashboard/ui-base:ui-base.label.category')` (FlowFuse's own i18n key, resolves to "dashboard 2", locale-safe). Repacked + reinstalled both into Docker, restarted; confirmed the served editor assets reference the key. Recorded as gotcha #11 in [[dashboard2-widget-gotchas]].

---

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| npm workspaces monorepo | 4 packages share binding DSL and sanitizer — one source of truth |
| Scoped names `@jsgorana/node-red-dashboard-2-scada-*` | Required for packages published after Jan 2022 per Node-RED docs |
| Apache-2.0 license | Explicit patent grant — important for industrial adopters (per SRS §13) |
| `ui-scada-mimic` / `ui-scada-faceplate` as node names | Avoids collision with any existing `ui-mimic` node |
| Core library built first (Phase 1) | SVG sanitizer is the highest XSS risk — must be green before any UI work |
| Docker container as primary local test | Container already running at 1880; install via `npm pack` + `docker cp` pattern |
| No bundled protocol drivers | Protocol-agnostic per SRS §1.2; show wiring in examples |
| README mirrors opcua module | Same author — consistent quality bar, screenshot-heavy, import examples |

---

## Open Questions / Decisions Pending

- [ ] Confirm Dashboard 2.0 min version to target (check latest `@flowfuse/node-red-dashboard` release)
- [ ] Confirm Vue 3 Options API vs Composition API — SRS says Options API per FlowFuse convention; verify current FlowFuse example nodes
- [ ] Monorepo vs separate GitHub repos — keeping monorepo for now; reconsider if packages need very different release cadences
- [ ] Symbol library: SVG hand-authored vs generated — start hand-authored, re-evaluate at Phase 3
