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
| 0 — Repo & scaffold | ⬜ Not started | |
| 1 — Core library | ⬜ Not started | DSL parser, SVG sanitizer, alarm FSM, theme tokens |
| 2 — ui-mimic | ⬜ Not started | |
| 3 — symbols | ⬜ Not started | |
| 4 — ui-faceplate | ⬜ Not started | |
| 5 — CI/CD | ⬜ Not started | |
| 6 — Docker local testing | ⬜ Not started | |
| 7 — Docs & README | ⬜ Not started | |
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
- Created project subfolder: `scada-kit-nrd2/`
- Wrote detailed `IMPLEMENTATION_PLAN.md` (8 phases, naming convention, Docker workflow, flows.nodered.org checklist)
- Created this `PROGRESS.md`

**Next session should start with:**
1. `cd '/Users/boss/Documents/Github Projects/scada-kit-nrd2'`
2. Read `PROGRESS.md` and `IMPLEMENTATION_PLAN.md`
3. Begin Phase 0: `gh repo create jsgorana/node-red-dashboard-2-scada-kit ...`

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
