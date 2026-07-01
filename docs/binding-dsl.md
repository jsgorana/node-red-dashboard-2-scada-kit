# Binding DSL Reference

The SCADA Kit drives an SVG entirely from data — there is **no per-screen JavaScript**. You author an SVG with `id`s on the elements you want to animate, then declare a JSON list of *bindings* that map incoming tag values onto those elements. The same DSL is shared by `ui-scada-mimic` and the faceplate templates, and is validated and evaluated by `@jsgorana/node-red-dashboard-2-scada`.

- **Validation** — `core`'s `parse(config)` validates the JSON against a JSON Schema (`BINDING_SCHEMA`). Invalid configs are rejected with a list of errors; they never reach the DOM.
- **Evaluation** — `core`'s `evaluate(binding, tagValue)` runs the transform pipeline for one binding and returns the final string to apply.
- **Application** — the widget applies that string to the matched SVG element(s) according to the binding's `target.type`.

---

## Data in

Each tick, the widget receives a **tag map**: an object whose keys are tag names. A binding's `source` is looked up in that map. A value may be a scalar or a `{ value, quality }` object:

```json
{
  "TK01.level": 76.1,
  "P101.run":   true,
  "P101.amps":  { "value": 11.0, "quality": "good" }
}
```

`quality` is one of `good` | `uncertain` | `stale` | `bad`. A scalar is treated as `{ value, quality: "good" }`. If a tag is missing or its value is `null`/`undefined`, the binding falls back to its `transform.default` (or applies nothing).

This kit is **protocol-agnostic** — produce that tag map however you like (OPC UA, Modbus, MQTT, Sparkplug, a `function` node, …).

---

## Config shape

The widget's **Bindings** field is a single JSON object:

```jsonc
{
  "bindings": [ /* … */ ],   // required
  "events":   [ /* … */ ]    // optional
}
```

### Binding object

| Field | Required | Description |
|-------|----------|-------------|
| `id` | no | Free-text label for your own reference. |
| `selector` | **yes** | CSS selector resolved **inside the SVG** (e.g. `#TK01_fill`, `.alarm-shape`). Applies to every matching element. |
| `source` | **yes** | Tag name to read from the tag map (e.g. `TK01.level`). |
| `target` | **yes** | What to change on the matched element — see [Targets](#targets). |
| `transform` | no | The value pipeline — see [Transform pipeline](#transform-pipeline). |

### Targets

`target.type` selects the DOM operation:

| `type` | Extra fields | Effect on the matched element |
|--------|--------------|-------------------------------|
| `text` | — | Sets `textContent`. |
| `attribute` | `name` | `setAttribute(name, value)`. |
| `style` | `name` | Sets the inline CSS property `style[name]`. |
| `visibility` | — | `display: ''` when the value is `true`/`"true"`, else `display: none`. |
| `level` | `max`, `axis` | Fills an SVG `<rect>` from the bottom up. `value` is treated as a percentage 0–100; the rect's `height` and `y` are driven so it fills up to `max` pixels. The original `y` is cached in `data-y0`. |
| `transform` | `name` | Sets the SVG `transform` attribute. `name: "rotate"` → `rotate(value, cx, cy)` about the element's bbox center; otherwise `name(value)` (e.g. `translate`, `scale`). |

> **Tip — `level`:** size `max` to the pixel height of the container you're filling. In the tank example `max: 152` matches the tank body height in user units.

---

## Transform pipeline

`transform` is optional. When present, stages run **in this fixed order**, each operating on the output of the previous one:

```
value → scale → valueMap → thresholds → format → (default) → (quality)
```

1. **`scale`** — linear interpolation: `{ "in": [inMin, inMax], "out": [outMin, outMax] }`. Maps an engineering range onto a display/geometry range. (If `inMin === inMax`, returns `outMin`.)
2. **`valueMap`** — exact lookup: `{ "true": "RUNNING", "false": "STOPPED" }`. The current value is stringified and matched against the keys. No match → value passes through unchanged.
3. **`thresholds`** — first match wins: an array of `{ op, value, result }`, with `op` ∈ `>` `>=` `<` `<=` `==` `!=`. Returns the `result` of the first satisfied rule, else passes through.
4. **`format`** — only applied when the value is still **numeric**: `{ decimals, prefix, suffix }`. `decimals` rounds via `toFixed`; `prefix`/`suffix` wrap the string.
5. **`default`** — if the value is `null`/`undefined` at this point (e.g. missing tag), use `default`.
6. **`quality`** — if the incoming quality is not `good`, override the result: `onUncertain`, `onStale`, or `onBad` (falls back to `onBad` for any non-good quality if the specific key is absent).

On any evaluation error the binding returns `transform.default` (or `null`).

### Quality and comm-loss

If the widget receives no input within its **comm-loss timeout**, every bound element is re-rendered with its `transform.quality.onBad` (or `default`) value — so a stale screen visibly degrades to a "no data" state instead of silently showing the last-known values. Always provide an `onBad`/`default` for anything safety-relevant.

---

## Events (write-back)

`events` make SVG elements interactive. Each event makes its element keyboard-accessible automatically (`tabindex`, `role="button"`, Enter/Space) for WCAG 2.1.1.

| Field | Required | Description |
|-------|----------|-------------|
| `selector` | **yes** | CSS selector inside the SVG. |
| `action` | **yes** | One of `click` `dblclick` `pointerdown` `pointerup` `focus` `blur`. |
| `emit.topic` | **yes** | `msg.topic` of the message sent out of the node. |
| `emit.payload` | no | `msg.payload` to send (defaults to `{}`). |

When the action fires, the widget sends a `widget-action` to the node, which emits `{ topic, payload }` from its output — wire that to your control logic.

```json
{
  "events": [
    { "selector": "#P101_body", "action": "click",
      "emit": { "topic": "pump/P101/toggle", "payload": { "cmd": "toggle" } } }
  ]
}
```

> For operator **writes** (setpoints, mode changes), prefer the `ui-scada-faceplate` node, which adds a confirmation step and **server-side RBAC + audit**. Mimic events are best for navigation and lightweight commands.

---

## Worked example — tank + pump

This is the exact binding set from [`mimic-tank-pump.json`](../packages/scada/examples/mimic-tank-pump.json). SVG element ids: `#TK01_fill` (a rect), `#TK01_level_text`, `#P101_body`, `#P101_status`, `#P101_amps`.

```json
{
  "bindings": [
    {
      "id": "tank-level-fill",
      "selector": "#TK01_fill",
      "source": "TK01.level",
      "target": { "type": "level", "axis": "y", "max": 152 },
      "transform": { "default": "0", "quality": { "onBad": "0" } }
    },
    {
      "id": "tank-level-text",
      "selector": "#TK01_level_text",
      "source": "TK01.level",
      "target": { "type": "text" },
      "transform": {
        "format": { "decimals": 1, "suffix": " %" },
        "default": "-- %",
        "quality": { "onBad": "-- %" }
      }
    },
    {
      "id": "pump-fill",
      "selector": "#P101_body",
      "source": "P101.run",
      "target": { "type": "style", "name": "fill" },
      "transform": {
        "valueMap": { "true": "#5c85d6", "false": "#9e9e9e" },
        "default": "#bdbdbd",
        "quality": { "onBad": "#bdbdbd" }
      }
    },
    {
      "id": "pump-status",
      "selector": "#P101_status",
      "source": "P101.run",
      "target": { "type": "text" },
      "transform": {
        "valueMap": { "true": "RUNNING", "false": "STOPPED" },
        "default": "NO DATA"
      }
    },
    {
      "id": "pump-amps",
      "selector": "#P101_amps",
      "source": "P101.amps",
      "target": { "type": "text" },
      "transform": { "format": { "decimals": 1, "suffix": " A" }, "default": "-- A" }
    }
  ]
}
```

What each binding does:

- **tank-level-fill** — fills the tank rect to the level percentage; degrades to empty on bad quality.
- **tank-level-text** — shows the level as `76.1 %`; `-- %` when there's no data.
- **pump-fill** — colors the pump blue when running, gray when stopped, neutral on bad data. Color signals the abnormal/active state only (HP-HMI).
- **pump-status** / **pump-amps** — redundant text labels so state never depends on color alone (HP-HMI / WCAG).

---

## Authoring checklist

- [ ] Every animated element has a **stable, unique `id`** in the SVG.
- [ ] Binding JSON parses and passes validation (the editor reports errors).
- [ ] Each binding has a `default` and, for safety-relevant items, a `quality.onBad`.
- [ ] Color is backed by a redundant **shape or text** binding (HP-HMI, not color-alone).
- [ ] `level` targets have a `max` matching the container height.
- [ ] Writes go through `ui-scada-faceplate` (RBAC), not raw mimic events.

See also: [Getting started](getting-started.md) · [Symbol catalog](symbol-catalog.md).
