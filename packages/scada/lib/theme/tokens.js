export const TOKEN_NAMES = Object.freeze({
  RUNNING:        '--hmi-running',
  STOPPED:        '--hmi-stopped',
  NO_FEEDBACK:    '--hmi-nofeedback',
  STARTING:       '--hmi-starting',
  STOPPING:       '--hmi-stopping',
  ALARM_HIGH:     '--hmi-alarm-high',
  ALARM_MED:      '--hmi-alarm-med',
  ALARM_LOW:      '--hmi-alarm-low',
  ALARM_ADVISORY: '--hmi-alarm-advisory',
  ALARM_UNACK:    '--hmi-alarm-unack',
  ALARM_SHELVED:  '--hmi-alarm-shelved',
  ALARM_OOS:      '--hmi-alarm-oos',
  BG_DISPLAY:     '--hmi-bg-display',
  BG_PANEL:       '--hmi-bg-panel',
  BG_GROUP:       '--hmi-bg-group',
  LINE_NORMAL:    '--hmi-line-normal',
  LINE_ACTIVE:    '--hmi-line-active',
  TEXT_PRIMARY:   '--hmi-text-primary',
  TEXT_SECONDARY: '--hmi-text-secondary',
  TEXT_VALUE:     '--hmi-text-value',
  TEXT_LABEL:     '--hmi-text-label',
})

export const DEFAULT_THEME = Object.freeze({
  [TOKEN_NAMES.RUNNING]:        '#9e9e9e',
  [TOKEN_NAMES.STOPPED]:        '#616161',
  [TOKEN_NAMES.NO_FEEDBACK]:    '#bdbdbd',
  [TOKEN_NAMES.STARTING]:       '#78909c',
  [TOKEN_NAMES.STOPPING]:       '#78909c',
  [TOKEN_NAMES.ALARM_HIGH]:     '#f44336',
  [TOKEN_NAMES.ALARM_MED]:      '#ff9800',
  [TOKEN_NAMES.ALARM_LOW]:      '#ffc107',
  [TOKEN_NAMES.ALARM_ADVISORY]: '#8bc34a',
  [TOKEN_NAMES.ALARM_UNACK]:    '#f44336',
  [TOKEN_NAMES.ALARM_SHELVED]:  '#9c27b0',
  [TOKEN_NAMES.ALARM_OOS]:      '#607d8b',
  [TOKEN_NAMES.BG_DISPLAY]:     '#f5f5f5',
  [TOKEN_NAMES.BG_PANEL]:       '#eeeeee',
  [TOKEN_NAMES.BG_GROUP]:       '#e0e0e0',
  [TOKEN_NAMES.LINE_NORMAL]:    '#757575',
  [TOKEN_NAMES.LINE_ACTIVE]:    '#424242',
  [TOKEN_NAMES.TEXT_PRIMARY]:   '#212121',
  [TOKEN_NAMES.TEXT_SECONDARY]: '#616161',
  [TOKEN_NAMES.TEXT_VALUE]:     '#212121',
  [TOKEN_NAMES.TEXT_LABEL]:     '#757575',
})

/** Returns a CSS :root block string. Pass partial overrides to customise tokens. */
export function buildCSSBlock(overrides = {}) {
  const merged = { ...DEFAULT_THEME, ...overrides }
  const vars = Object.entries(merged).map(([k, v]) => `  ${k}: ${v};`).join('\n')
  return `:root {\n${vars}\n}`
}
