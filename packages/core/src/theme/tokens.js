/**
 * HP-HMI theme token names (CSS variable names) and their default values.
 * Override these in a root CSS rule to apply a custom Style Guide.
 *
 * Usage:
 *   import { TOKEN_NAMES, DEFAULT_THEME } from '@jsgorana/node-red-dashboard-2-scada-core/theme/tokens';
 */

/** CSS variable names — use these as keys when reading computed styles. */
const TOKEN_NAMES = Object.freeze({
  // Equipment states
  RUNNING:        '--hmi-running',
  STOPPED:        '--hmi-stopped',
  NO_FEEDBACK:    '--hmi-nofeedback',
  STARTING:       '--hmi-starting',
  STOPPING:       '--hmi-stopping',

  // Alarm priorities (ISA-18.2)
  ALARM_HIGH:     '--hmi-alarm-high',
  ALARM_MED:      '--hmi-alarm-med',
  ALARM_LOW:      '--hmi-alarm-low',
  ALARM_ADVISORY: '--hmi-alarm-advisory',

  // Alarm state decorators
  ALARM_UNACK:    '--hmi-alarm-unack',   // flashing/indicator for unacknowledged
  ALARM_SHELVED:  '--hmi-alarm-shelved',
  ALARM_OOS:      '--hmi-alarm-oos',

  // Display backgrounds
  BG_DISPLAY:     '--hmi-bg-display',    // main display background
  BG_PANEL:       '--hmi-bg-panel',      // faceplates / overlay panels
  BG_GROUP:       '--hmi-bg-group',      // equipment group bounding box

  // Process lines / piping
  LINE_NORMAL:    '--hmi-line-normal',
  LINE_ACTIVE:    '--hmi-line-active',

  // Text
  TEXT_PRIMARY:   '--hmi-text-primary',
  TEXT_SECONDARY: '--hmi-text-secondary',
  TEXT_VALUE:     '--hmi-text-value',    // live numeric values
  TEXT_LABEL:     '--hmi-text-label',
});

/**
 * Default HP-HMI colour values per ISA-101 High-Performance HMI guidelines.
 * Gray palette; colour reserved for abnormal/alarm states only.
 *
 * These are injected as a :root CSS block by the Dashboard widget on mount.
 */
const DEFAULT_THEME = Object.freeze({
  [TOKEN_NAMES.RUNNING]:        '#9e9e9e',  // medium gray — running (distinguished by label)
  [TOKEN_NAMES.STOPPED]:        '#616161',  // darker gray — stopped
  [TOKEN_NAMES.NO_FEEDBACK]:    '#bdbdbd',  // light gray — comm-loss / unknown
  [TOKEN_NAMES.STARTING]:       '#78909c',  // blue-gray — transient
  [TOKEN_NAMES.STOPPING]:       '#78909c',

  [TOKEN_NAMES.ALARM_HIGH]:     '#f44336',  // red    — high priority, action required
  [TOKEN_NAMES.ALARM_MED]:      '#ff9800',  // amber  — medium priority
  [TOKEN_NAMES.ALARM_LOW]:      '#ffc107',  // yellow — low priority
  [TOKEN_NAMES.ALARM_ADVISORY]: '#8bc34a',  // green  — advisory / informational

  [TOKEN_NAMES.ALARM_UNACK]:    '#f44336',  // same as high — drives flashing indicator
  [TOKEN_NAMES.ALARM_SHELVED]:  '#9c27b0',  // purple — shelved/suppressed
  [TOKEN_NAMES.ALARM_OOS]:      '#607d8b',  // blue-gray — out of service

  [TOKEN_NAMES.BG_DISPLAY]:     '#f5f5f5',  // near-white display background
  [TOKEN_NAMES.BG_PANEL]:       '#eeeeee',
  [TOKEN_NAMES.BG_GROUP]:       '#e0e0e0',

  [TOKEN_NAMES.LINE_NORMAL]:    '#757575',
  [TOKEN_NAMES.LINE_ACTIVE]:    '#424242',

  [TOKEN_NAMES.TEXT_PRIMARY]:   '#212121',
  [TOKEN_NAMES.TEXT_SECONDARY]: '#616161',
  [TOKEN_NAMES.TEXT_VALUE]:     '#212121',
  [TOKEN_NAMES.TEXT_LABEL]:     '#757575',
});

/**
 * Returns a CSS :root block string ready to inject into the document.
 * Pass a partial overrides object to customise individual tokens.
 */
function buildCSSBlock(overrides = {}) {
  const merged = { ...DEFAULT_THEME, ...overrides };
  const vars = Object.entries(merged)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  return `:root {\n${vars}\n}`;
}

module.exports = { TOKEN_NAMES, DEFAULT_THEME, buildCSSBlock };
