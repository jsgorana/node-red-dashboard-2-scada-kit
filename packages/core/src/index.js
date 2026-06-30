const { sanitizeSVG } = require('./sanitizer/server');
const { parse }       = require('./dsl/parser');
const { evaluate, applyScale, applyThresholds, applyFormat } = require('./dsl/evaluator');
const { STATES, EVENTS, TRANSITIONS, transition, isActionRequired, isSilenced } = require('./alarm/fsm');
const { TOKEN_NAMES, DEFAULT_THEME, buildCSSBlock } = require('./theme/tokens');

module.exports = {
  // Sanitizer
  sanitizeSVG,
  // DSL
  parse,
  evaluate,
  applyScale,
  applyThresholds,
  applyFormat,
  // Alarm FSM
  STATES,
  EVENTS,
  TRANSITIONS,
  transition,
  isActionRequired,
  isSilenced,
  // Theme
  TOKEN_NAMES,
  DEFAULT_THEME,
  buildCSSBlock,
};
