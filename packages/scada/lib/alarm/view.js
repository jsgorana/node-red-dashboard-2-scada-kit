import { STATES, isActionRequired, isSilenced } from './fsm.js'

export const PRIORITIES = Object.freeze({
  HIGH:     'HIGH',
  MEDIUM:   'MEDIUM',
  LOW:      'LOW',
  ADVISORY: 'ADVISORY',
})

export const ALARM_ACTIONS = Object.freeze({
  ACK:       'alarm.ack',
  SHELVE:    'alarm.shelve',
  UNSHELVE:  'alarm.unshelve',
  OOS_ENTER: 'alarm.oos.enter',
  OOS_EXIT:  'alarm.oos.exit',
})

const STATE_META = Object.freeze({
  [STATES.NORMAL]: {
    label: 'Normal',
    className: 'alarm-normal',
    token: 'var(--hmi-stopped)',
    shape: 'none',
  },
  [STATES.UNACK]: {
    label: 'Unacknowledged',
    className: 'alarm-unack',
    token: 'var(--hmi-alarm-unack)',
    shape: 'diamond',
  },
  [STATES.ACK]: {
    label: 'Acknowledged',
    className: 'alarm-ack',
    token: 'var(--hmi-alarm-high)',
    shape: 'outline-diamond',
  },
  [STATES.RTN_UNACK]: {
    label: 'Return to normal - unacknowledged',
    className: 'alarm-rtn-unack',
    token: 'var(--hmi-alarm-unack)',
    shape: 'hollow-diamond',
  },
  [STATES.SHELVED]: {
    label: 'Shelved',
    className: 'alarm-shelved',
    token: 'var(--hmi-alarm-shelved)',
    shape: 'pause',
  },
  [STATES.SUPPRESSED_BY_DESIGN]: {
    label: 'Suppressed by design',
    className: 'alarm-suppressed',
    token: 'var(--hmi-alarm-shelved)',
    shape: 'slash',
  },
  [STATES.OUT_OF_SERVICE]: {
    label: 'Out of service',
    className: 'alarm-oos',
    token: 'var(--hmi-alarm-oos)',
    shape: 'wrench',
  },
})

const PRIORITY_META = Object.freeze({
  [PRIORITIES.HIGH]: {
    label: 'High',
    className: 'priority-high',
    token: 'var(--hmi-alarm-high)',
  },
  [PRIORITIES.MEDIUM]: {
    label: 'Medium',
    className: 'priority-medium',
    token: 'var(--hmi-alarm-med)',
  },
  [PRIORITIES.LOW]: {
    label: 'Low',
    className: 'priority-low',
    token: 'var(--hmi-alarm-low)',
  },
  [PRIORITIES.ADVISORY]: {
    label: 'Advisory',
    className: 'priority-advisory',
    token: 'var(--hmi-alarm-advisory)',
  },
})

export function normalizeAlarm(alarm = {}) {
  if (!alarm || typeof alarm !== 'object') {
    return {
      state: STATES.NORMAL,
      priority: PRIORITIES.LOW,
      message: '',
      active: false,
      shelvedUntil: null,
      source: '',
    }
  }

  const state = STATE_META[alarm.state] ? alarm.state : STATES.NORMAL
  const priority = PRIORITY_META[alarm.priority] ? alarm.priority : PRIORITIES.LOW

  return {
    state,
    priority,
    message: alarm.message ? String(alarm.message) : '',
    active: Boolean(alarm.active ?? state !== STATES.NORMAL),
    shelvedUntil: alarm.shelvedUntil ?? null,
    source: alarm.source ? String(alarm.source) : '',
  }
}

export function alarmView(alarm = {}) {
  const normalized = normalizeAlarm(alarm)
  const stateMeta = STATE_META[normalized.state]
  const priorityMeta = PRIORITY_META[normalized.priority]

  return {
    ...normalized,
    label: stateMeta.label,
    className: `${stateMeta.className} ${priorityMeta.className}`,
    token: normalized.state === STATES.NORMAL ? stateMeta.token : priorityMeta.token,
    shape: stateMeta.shape,
    priorityLabel: priorityMeta.label,
    actionRequired: isActionRequired(normalized.state),
    silenced: isSilenced(normalized.state),
  }
}

export function availableAlarmActions(alarm = {}) {
  const { state } = normalizeAlarm(alarm)
  return {
    ack: state === STATES.UNACK || state === STATES.RTN_UNACK,
    shelve: state === STATES.UNACK,
    unshelve: state === STATES.SHELVED,
    oosEnter: state !== STATES.OUT_OF_SERVICE,
    oosExit: state === STATES.OUT_OF_SERVICE,
  }
}
