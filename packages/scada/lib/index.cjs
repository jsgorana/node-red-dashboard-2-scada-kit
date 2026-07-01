// Server-side entry for Node-RED require() compatibility.
// Node.js v22+ can synchronously require ESM modules from CommonJS.
const sanitizer = require('./sanitizer/server.js')
const parser = require('./dsl/parser.js')
const evaluator = require('./dsl/evaluator.js')
const fsm = require('./alarm/fsm.js')
const alarmView = require('./alarm/view.js')
const tokens = require('./theme/tokens.js')

module.exports = {
  sanitizeSVG: sanitizer.sanitizeSVG,
  parse: parser.parse,
  evaluate: evaluator.evaluate,
  applyScale: evaluator.applyScale,
  applyThresholds: evaluator.applyThresholds,
  applyFormat: evaluator.applyFormat,
  STATES: fsm.STATES,
  EVENTS: fsm.EVENTS,
  TRANSITIONS: fsm.TRANSITIONS,
  transition: fsm.transition,
  isActionRequired: fsm.isActionRequired,
  isSilenced: fsm.isSilenced,
  PRIORITIES: alarmView.PRIORITIES,
  ALARM_ACTIONS: alarmView.ALARM_ACTIONS,
  normalizeAlarm: alarmView.normalizeAlarm,
  alarmView: alarmView.alarmView,
  availableAlarmActions: alarmView.availableAlarmActions,
  TOKEN_NAMES: tokens.TOKEN_NAMES,
  DEFAULT_THEME: tokens.DEFAULT_THEME,
  buildCSSBlock: tokens.buildCSSBlock,
}
