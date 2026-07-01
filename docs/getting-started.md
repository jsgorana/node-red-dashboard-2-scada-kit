# Getting Started

This tutorial gets a live SCADA mimic on screen in a few minutes, then shows how to build your own from an SVG and a handful of tag bindings.

## Prerequisites

- Node.js `>=20`
- Node-RED `>=4.0`
- `@flowfuse/node-red-dashboard` `>=1.0` (Dashboard 2.0) installed and a Dashboard page configured

## 1. Install

**Palette Manager** *(once published)* — **Menu → Manage palette → Install**, search `@jsgorana/node-red-dashboard-2-scada`, click **Install**. Both nodes (`ui-scada-mimic`, `ui-scada-faceplate`) are added.

**npm** *(once published)*

```bash
npm install @jsgorana/node-red-dashboard-2-scada
```

**From source (Docker dev)** — see [`scripts/dev-install.sh`](../scripts/dev-install.sh): it packs the package and installs it into a running `node-red` container without touching your existing flows.

Restart Node-RED after installing.

## 2. Quick start — import the example

The fastest way to see it working is the bundled example flow:

1. **Menu → Import → Examples → `@jsgorana/node-red-dashboard-2-scada`** and pick **mimic-tank-pump** (or import [`packages/scada/examples/mimic-tank-pump.json`](../packages/scada/examples/mimic-tank-pump.json) directly).
2. Click **Deploy**.
3. Open your Dashboard. You'll see a tank filling and a pump turning blue / `RUNNING` with live amps, driven by the example's `inject` + `function` simulator.

The example bundles its own Dashboard base/theme/page/group, so it renders immediately. To use it for real, delete the `inject`/`function` simulator and feed the `ui-scada-mimic` node a tag map from your protocol source.

## 3. Build your own mimic

### a. Author an SVG

Draw your process in any SVG tool. Give every element you want to animate a **stable, unique `id`**. For a tank + pump:

```svg
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="20" width="60" height="160" fill="none" stroke="#616161" stroke-width="3"/>
  <rect id="TK01_fill" x="20" y="172" width="60" height="0" fill="#5c85d6"/>
  <text id="TK01_level_text" x="50" y="195" text-anchor="middle" stroke="none">-- %</text>

  <circle id="P101_body" cx="150" cy="100" r="26" fill="#bdbdbd"/>
  <text id="P101_status" x="150" y="140" text-anchor="middle" stroke="none">NO DATA</text>
  <text id="P101_amps"   x="150" y="156" text-anchor="middle" stroke="none">-- A</text>
</svg>
```

> **Gotcha:** if text sits inside a `<g>` that has a `stroke`, set `stroke="none"` on the `<text>` or the glyphs render as an unreadable bold smear.

### b. Configure the node

Drag in a **ui-scada-mimic** node and set:

- **Group** — a Dashboard group on your page.
- **Size** — width/height in grid units (height = rows × 48px). Use the size picker.
- **SVG** — paste the markup from step (a).
- **Bindings** — the JSON below.
- **Comm-loss timeout** — ms before the screen degrades to its `onBad`/`default` state.

### c. Write the bindings

```json
{
  "bindings": [
    { "selector": "#TK01_fill", "source": "TK01.level",
      "target": { "type": "level", "axis": "y", "max": 152 },
      "transform": { "default": "0", "quality": { "onBad": "0" } } },
    { "selector": "#TK01_level_text", "source": "TK01.level",
      "target": { "type": "text" },
      "transform": { "format": { "decimals": 1, "suffix": " %" }, "default": "-- %" } },
    { "selector": "#P101_body", "source": "P101.run",
      "target": { "type": "style", "name": "fill" },
      "transform": { "valueMap": { "true": "#5c85d6", "false": "#9e9e9e" }, "default": "#bdbdbd" } },
    { "selector": "#P101_status", "source": "P101.run",
      "target": { "type": "text" },
      "transform": { "valueMap": { "true": "RUNNING", "false": "STOPPED" }, "default": "NO DATA" } }
  ]
}
```

See the [Binding DSL reference](binding-dsl.md) for every target type and transform.

### d. Feed it tags

The node expects a **tag map** in `msg.payload` — keys are tag names matching your bindings' `source`:

```js
// function node
msg.payload = {
  "TK01.level": 76.1,
  "P101.run":  true
};
return msg;
```

In production, replace this with your OPC UA / Modbus / MQTT / Sparkplug nodes, normalized to that flat tag map. Deploy and watch the mimic come alive.

## 4. Add a faceplate (operator writes)

For setpoint changes, mode switches, and other **writes**, use `ui-scada-faceplate` rather than mimic events — it adds a client-side confirmation step and **server-side RBAC + audit**.

Import [`packages/scada/examples/faceplate-pid-rbac.json`](../packages/scada/examples/faceplate-pid-rbac.json) to see a PID faceplate wired end-to-end:

- **Output 1** — the allowed write / state passthrough.
- **Output 2** — the audit stream (emitted for both allowed *and* denied writes).

Writes are **denied by default**: a browser-asserted role is never trusted. Map Dashboard authentication and the node's allowed roles (`operator` / `supervisor` / `engineer`) to permit real writes. Until then, unauthenticated writes are correctly denied and audited — useful for verifying the gate.

## 5. Use the symbol library

The package bundles ready-made HP-HMI SVG symbols (pump, motor, valves, tank, conveyor, breaker, bargraph, multistate indicator, mini-trend, pipe) with stable, documented element ids you can bind against — accessible via `require('@jsgorana/node-red-dashboard-2-scada/symbols')`. Pull a symbol's SVG into a mimic and bind to its `*-status-text`, `*-value-text`, level, and alarm ids. See the [Symbol catalog](symbol-catalog.md).

## Next steps

- [Binding DSL reference](binding-dsl.md) — the full target/transform contract.
- [Symbol catalog](symbol-catalog.md) — every symbol and its bindable ids.
- Standards notes and acknowledgements are in the [README](../README.md).
