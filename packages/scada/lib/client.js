// Browser/ESM entry — processed by Vite for the UMD bundle.
// Imports CJS modules via namespace then re-exports named members.

export { sanitizeSVG, createMutationGuard } from './sanitizer/client.js'

import * as _parser    from './dsl/parser.js'
import * as _evaluator from './dsl/evaluator.js'
import * as _fsm       from './alarm/fsm.js'
import * as _alarmView from './alarm/view.js'
import * as _tokens    from './theme/tokens.js'

export const parse             = _parser.parse
export const evaluate          = _evaluator.evaluate
export const applyScale        = _evaluator.applyScale
export const applyThresholds   = _evaluator.applyThresholds
export const applyFormat       = _evaluator.applyFormat
export const STATES            = _fsm.STATES
export const EVENTS            = _fsm.EVENTS
export const TRANSITIONS       = _fsm.TRANSITIONS
export const transition        = _fsm.transition
export const isActionRequired  = _fsm.isActionRequired
export const isSilenced        = _fsm.isSilenced
export const PRIORITIES        = _alarmView.PRIORITIES
export const ALARM_ACTIONS     = _alarmView.ALARM_ACTIONS
export const normalizeAlarm    = _alarmView.normalizeAlarm
export const alarmView         = _alarmView.alarmView
export const availableAlarmActions = _alarmView.availableAlarmActions
export const TOKEN_NAMES       = _tokens.TOKEN_NAMES
export const DEFAULT_THEME     = _tokens.DEFAULT_THEME
export const buildCSSBlock     = _tokens.buildCSSBlock
