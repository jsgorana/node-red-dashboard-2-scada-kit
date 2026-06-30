# node-red-dashboard-2-scada-kit

> HP-HMI / SCADA widget kit for [Node-RED Dashboard 2.0](https://github.com/FlowFuse/node-red-dashboard) — SVG synoptic displays, equipment faceplates, and an ISA-101-styled symbol library.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node-RED](https://img.shields.io/badge/node--red-%3E%3D4.0.0-red)](https://nodered.org)
[![Dashboard 2.0](https://img.shields.io/badge/dashboard--2.0-%3E%3D1.0.0-orange)](https://github.com/FlowFuse/node-red-dashboard)

---

> **Status: 🚧 Under development — Phase 0 scaffold complete**

---

## What You Get

| Package | npm | Description |
|---------|-----|-------------|
| `ui-scada-mimic` | [`@jsgorana/node-red-dashboard-2-scada-mimic`](https://www.npmjs.com/package/@jsgorana/node-red-dashboard-2-scada-mimic) | Render a process SVG with declarative tag bindings — no per-screen JavaScript |
| `ui-scada-faceplate` | [`@jsgorana/node-red-dashboard-2-scada-faceplate`](https://www.npmjs.com/package/@jsgorana/node-red-dashboard-2-scada-faceplate) | Popup equipment panels (motor, valve, PID) with write-confirmation and RBAC |
| SVG Symbols | [`@jsgorana/node-red-dashboard-2-scada-symbols`](https://www.npmjs.com/package/@jsgorana/node-red-dashboard-2-scada-symbols) | Parameterized HP-HMI process symbols: pumps, valves, tanks, breakers, gauges |
| Core library | [`@jsgorana/node-red-dashboard-2-scada-core`](https://www.npmjs.com/package/@jsgorana/node-red-dashboard-2-scada-core) | Shared binding DSL, SVG sanitizer, ISA-18.2 alarm FSM *(internal dependency)* |

The kit is **protocol-agnostic** — it consumes normalized tag values from any upstream Node-RED node (OPC UA, Modbus, MQTT, Sparkplug, etc.) and does not bundle drivers.

## Standards compliance

| Standard | Coverage |
|----------|----------|
| ISA-101 / High-Performance HMI | Display hierarchy, gray palette, color-for-abnormal-only, shape+label redundancy |
| ISA-18.2 / IEC 62682 | Full 7-state alarm lifecycle, priority distribution, ack/shelve |
| IEC 62443-4-1 / 4-2 | Secure SDL, RBAC, audit logging, SVG sanitization, SBOM |
| OWASP Top 10:2021 | XSS (A03) via DOMPurify + CSP; access control (A01) server-side deny-by-default |
| WCAG 2.2 AA | Keyboard operability, target size, focus, contrast, not color-alone |

## Requirements

- Node.js `>=20.0.0`
- Node-RED `>=4.0.0`
- `@flowfuse/node-red-dashboard` `>=1.0.0` (Dashboard 2.0)

## Installation

> *(Not yet published — install from source during development)*

### Palette Manager *(once published)*

1. Open **Menu → Manage palette → Install**
2. Search `@jsgorana/node-red-dashboard-2-scada-mimic`
3. Click **Install**

### npm *(once published)*

```bash
npm install @jsgorana/node-red-dashboard-2-scada-mimic
npm install @jsgorana/node-red-dashboard-2-scada-faceplate
npm install @jsgorana/node-red-dashboard-2-scada-symbols
```

### Local development (Docker)

```bash
./scripts/dev-install.sh ui-mimic
```

See [scripts/dev-install.sh](scripts/dev-install.sh) for details.

## Repository structure

```
packages/
  core/          @jsgorana/node-red-dashboard-2-scada-core
  ui-mimic/      @jsgorana/node-red-dashboard-2-scada-mimic
  ui-faceplate/  @jsgorana/node-red-dashboard-2-scada-faceplate
  symbols/       @jsgorana/node-red-dashboard-2-scada-symbols
examples/        Importable Node-RED flow JSONs
docs/            Binding DSL reference, symbol catalog, getting-started tutorial
scripts/         Developer tooling
```

## Acknowledgements

This kit builds on and is inspired by several outstanding open-source projects and standards. See [NOTICE](NOTICE) for the full list.

Key acknowledgements:
- **[Node-RED](https://nodered.org)** — OpenJS Foundation
- **[Node-RED Dashboard 2.0](https://github.com/FlowFuse/node-red-dashboard)** — FlowFuse Inc.
- **[node-red-contrib-ui-svg](https://github.com/bartbutenaers/node-red-contrib-ui-svg)** — Bart Butenaers *(binding model inspiration)*
- **[DOMPurify](https://github.com/cure53/DOMPurify)** — Cure53 *(SVG sanitization)*
- **ISA-101, ISA-18.2, IEC 62443, WCAG 2.2** — standards that define the compliance targets

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security issues: see [SECURITY.md](SECURITY.md).

## License

[Apache-2.0](LICENSE) © 2026 jsgorana
