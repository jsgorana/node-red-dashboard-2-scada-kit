# Symbol Catalog

The symbol library contains hand-authored HP-HMI SVGs for Dashboard 2.0 mimic displays. Each SVG has stable element IDs for the binding DSL and uses theme tokens from `@jsgorana/node-red-dashboard-2-scada`.

## Binding Rules

- Normal equipment fill starts at `var(--hmi-stopped)`.
- Running state uses `var(--hmi-running)` plus a `RUNNING` text label or motion shape.
- Alarm state uses `var(--hmi-alarm-high)` plus an alarm shape and `!` text marker.
- Bind only to IDs documented in `packages/scada/symbols/src/catalog.json`.

## Symbols

| ID | File | Category | Bindable elements |
|----|------|----------|-------------------|
| `pump` | `pump.svg` | Rotating equipment | `pump-body`, `pump-flow-arrow`, `pump-status-text`, `pump-alarm-shape`, `pump-alarm-text` |
| `motor` | `motor.svg` | Rotating equipment | `motor-body`, `motor-shaft`, `motor-status-text`, `motor-alarm-shape` |
| `valve-gate` | `valve-gate.svg` | Valves | `valve-gate-body-left`, `valve-gate-body-right`, `valve-gate-status-text`, `valve-gate-alarm-shape` |
| `valve-ball` | `valve-ball.svg` | Valves | `valve-ball-body`, `valve-ball-port`, `valve-ball-status-text`, `valve-ball-alarm-shape` |
| `tank` | `tank.svg` | Vessels | `tank-level`, `tank-value-text`, `tank-status-text`, `tank-alarm-shape` |
| `conveyor` | `conveyor.svg` | Material handling | `conveyor-belt`, `conveyor-arrow-1`, `conveyor-arrow-2`, `conveyor-status-text` |
| `breaker` | `breaker.svg` | Electrical | `breaker-blade`, `breaker-contact-top`, `breaker-contact-bottom`, `breaker-status-text`, `breaker-alarm-shape` |
| `bargraph` | `bargraph.svg` | Indicators | `bargraph-value`, `bargraph-value-text`, `bargraph-high-limit`, `bargraph-alarm-shape` |
| `multistate-indicator` | `multistate-indicator.svg` | Indicators | `multistate-state-shape`, `multistate-state-text`, `multistate-value-text`, `multistate-alarm-shape` |
| `mini-trend` | `mini-trend.svg` | Indicators | `mini-trend-trace`, `mini-trend-high-limit`, `mini-trend-value-text`, `mini-trend-alarm-shape` |
| `pipe` | `pipe.svg` | Piping | `pipe-line`, `pipe-flow-arrow-1`, `pipe-flow-arrow-2`, `pipe-status-text` |

Run `npm test` to validate that catalog entries match real SVG element IDs.

## Dashboard Test Flow

The Docker Dashboard 2.0 symbol-gallery test is documented in [Phase 3 Docker Symbol Tests](phase3-docker-symbol-tests.md).

Use it after changing symbol geometry, binding hooks, theme tokens, or `ui-scada-mimic` sizing behavior:

```bash
npm run phase3:deploy
npm run phase3:verify
```
