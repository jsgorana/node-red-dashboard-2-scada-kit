const STATES = Object.freeze({
  NORMAL:                'NORMAL',
  UNACK:                 'UNACK',
  ACK:                   'ACK',
  RTN_UNACK:             'RTN_UNACK',
  SHELVED:               'SHELVED',
  SUPPRESSED_BY_DESIGN:  'SUPPRESSED_BY_DESIGN',
  OUT_OF_SERVICE:        'OUT_OF_SERVICE',
});

const EVENTS = Object.freeze({
  ALARM_RAISED:      'ALARM_RAISED',
  ALARM_CLEARED:     'ALARM_CLEARED',
  OPERATOR_ACK:      'OPERATOR_ACK',
  OPERATOR_SHELVE:   'OPERATOR_SHELVE',
  SHELVE_EXPIRED:    'SHELVE_EXPIRED',
  OPERATOR_UNSHELVE: 'OPERATOR_UNSHELVE',
  SUPPRESS:          'SUPPRESS',
  UNSUPPRESS:        'UNSUPPRESS',
  OOS_ENTER:         'OOS_ENTER',
  OOS_EXIT:          'OOS_EXIT',
});

const TRANSITIONS = Object.freeze({
  [STATES.NORMAL]:               { [EVENTS.ALARM_RAISED]: STATES.UNACK, [EVENTS.SUPPRESS]: STATES.SUPPRESSED_BY_DESIGN, [EVENTS.OOS_ENTER]: STATES.OUT_OF_SERVICE },
  [STATES.UNACK]:                { [EVENTS.OPERATOR_ACK]: STATES.ACK, [EVENTS.ALARM_CLEARED]: STATES.RTN_UNACK, [EVENTS.OPERATOR_SHELVE]: STATES.SHELVED },
  [STATES.ACK]:                  { [EVENTS.ALARM_CLEARED]: STATES.NORMAL, [EVENTS.ALARM_RAISED]: STATES.UNACK },
  [STATES.RTN_UNACK]:            { [EVENTS.OPERATOR_ACK]: STATES.NORMAL },
  [STATES.SHELVED]:              { [EVENTS.SHELVE_EXPIRED]: STATES.UNACK, [EVENTS.OPERATOR_UNSHELVE]: STATES.UNACK },
  [STATES.SUPPRESSED_BY_DESIGN]: { [EVENTS.UNSUPPRESS]: STATES.NORMAL },
  [STATES.OUT_OF_SERVICE]:       { [EVENTS.OOS_EXIT]: STATES.NORMAL },
});

/** Transition to next state. Returns { state, changed }. Unrecognised events are a no-op. */
function transition(currentState, event) {
  const nextState = TRANSITIONS[currentState]?.[event];
  return { state: nextState ?? currentState, changed: nextState !== undefined };
}

/** True when the alarm needs operator attention (UNACK or RTN_UNACK). */
function isActionRequired(state) {
  return state === STATES.UNACK || state === STATES.RTN_UNACK;
}

/** True when the alarm is silenced in any way (shelved, suppressed, or out-of-service). */
function isSilenced(state) {
  return state === STATES.SHELVED || state === STATES.SUPPRESSED_BY_DESIGN || state === STATES.OUT_OF_SERVICE;
}

module.exports = { STATES, EVENTS, TRANSITIONS, transition, isActionRequired, isSilenced };
