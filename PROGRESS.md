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
| 1 — Core library | ⬜ Not started | DSL parser, SVG sanitizer, alarm FSM, theme tokens |
| 2 — ui-mimic | ⬜ Not started | |
| 3 — symbols | ⬜ Not started | |
| 4 — ui-faceplate | ⬜ Not started | |
| 5 — CI/CD | ✅ Complete | ci.yml + release.yml committed with Phase 0 |
| 6 — Docker local testing | ⬜ Not started | scripts/dev-install.sh ready |
| 7 — Docs & README | 🔄 In progress | README scaffold done; screenshots/examples pending |
| 8 — flows.nodered.org | ⬜ Not started | Only after stable + documented |

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
2. Read `PROGRESS.md` — then begin **Phase 1: Core library**
3. `packages/core/src/dsl/parser.js` — ajv schema + validation
4. `packages/core/src/sanitizer/server.js` — DOMPurify-over-jsdom
5. `packages/core/src/alarm/fsm.js` — ISA-18.2 state machine
6. Write XSS corpus tests first (`packages/core/test/sanitizer.spec.js`)

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
