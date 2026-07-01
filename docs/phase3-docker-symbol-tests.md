# Phase 3 Docker Symbol Tests

This page documents the Dashboard 2.0 test flow for the Phase 3 symbol library. The flow is installed into the local Docker Node-RED instance without replacing existing user flows.

## Commands

Build and install the current local packages into Docker first:

```bash
npm run build --workspaces --if-present
rm -rf work/phase3-packages && mkdir -p work/phase3-packages
npm pack --workspace @jsgorana/node-red-dashboard-2-scada-core --pack-destination work/phase3-packages
npm pack --workspace @jsgorana/node-red-dashboard-2-scada-symbols --pack-destination work/phase3-packages
npm pack --workspace @jsgorana/node-red-dashboard-2-scada-mimic --pack-destination work/phase3-packages
for tgz in work/phase3-packages/*.tgz; do docker cp "$tgz" node-red:/data/; done
docker exec node-red npm install --prefix /data /data/jsgorana-node-red-dashboard-2-scada-core-0.1.0.tgz /data/jsgorana-node-red-dashboard-2-scada-symbols-0.1.0.tgz /data/jsgorana-node-red-dashboard-2-scada-mimic-0.1.0.tgz
docker restart node-red
```

Deploy or update only the Phase 3 flow:

```bash
npm run phase3:deploy
```

Verify the live Dashboard page:

```bash
npm run phase3:verify
```

The Dashboard test page is:

```text
http://localhost:1880/scada/symbols
```

## Flow Safety

`scripts/deploy-phase3-symbol-tests.mjs` uses the Node-RED Admin API in flow-scoped mode:

- first run: `POST /flow`
- later runs: `PUT /flow/:id`
- target flow label: `SCADA Kit — Phase 3 Symbols`

It does not call `POST /flows` and does not replace the whole flow set.

The current Docker test flow id assigned by Node-RED is `0f4b2de6ca3a9671`.

## Sizing Model

The Phase 2 demo established the sizing rule that Dashboard widget dimensions must be explicit. The Phase 3 test follows that same pattern:

- group width: `12`
- group height: `10`
- `ui-scada-mimic` width: `12`
- `ui-scada-mimic` height: `10`
- gallery viewBox: `0 0 1440 640`
- `preserveAspectRatio`: `xMidYMin meet`

The gallery intentionally uses one top-level SVG only. Symbol SVG source is unpacked into scaled `<g>` groups, so nested `<svg>` sizing cannot interfere with the mimic widget's top-level contain behavior.

Expected browser geometry at a 1440px viewport is approximately:

- widget/root SVG: `1207 x 534`
- symbol cells: consistent, about `175 x 207`
- summary text: `PASS 11/11 symbols`

## Theme Tokens

The symbol SVGs use HP-HMI CSS variables such as `--hmi-running`, `--hmi-stopped`, and `--hmi-alarm-high`. Dashboard 2.0 does not define those custom properties by default, so the Phase 3 gallery root SVG includes the token values inline.

Without these variables, Chrome treats the SVG paint declarations as invalid and the symbols appear as blank boxes.

## Verification Coverage

`scripts/verify-phase3-symbol-tests.mjs` opens the live Dashboard page with Playwright and checks:

- the gallery root SVG exists
- the root SVG fills the Dashboard widget
- the fixed viewBox and `preserveAspectRatio` are present
- no nested SVG wrappers are present
- all 11 symbol cells render
- all 11 symbols report `PASS`
- alarm examples include shape+text affordance
- computed SVG paints resolve to real RGB colors
- running/stopped and alarm/stopped colors remain distinguishable under a deuteranopia simulation

This does not replace manual visual inspection, but it catches the layout and theme failures that caused the blank-box and unpredictable-size regressions.
