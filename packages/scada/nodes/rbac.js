const DEFAULT_WRITE_ROLES = new Set(['operator', 'supervisor', 'engineer'])
const DEFAULT_ACK_ROLES = new Set(['operator', 'supervisor', 'engineer'])
const DEFAULT_SHELVE_ROLES = new Set(['supervisor', 'engineer'])
const DEFAULT_OOS_ROLES = new Set(['engineer'])
const MAX_SHELVE_MS = 24 * 60 * 60 * 1000

let nextCorrelation = 0

function parseRoles(value, fallback) {
  if (!value) return fallback
  const roles = String(value).split(',').map(r => r.trim()).filter(Boolean)
  return roles.length ? new Set(roles) : fallback
}

function getAllowedRoles(config = {}, action = '') {
  if (action.startsWith('alarm.ack')) return parseRoles(config.ackRoles, DEFAULT_ACK_ROLES)
  if (action.startsWith('alarm.shelve') || action.startsWith('alarm.unshelve')) {
    return parseRoles(config.shelveRoles, DEFAULT_SHELVE_ROLES)
  }
  if (action.startsWith('alarm.oos')) return parseRoles(config.oosRoles, DEFAULT_OOS_ROLES)
  return parseRoles(config.allowRoles, DEFAULT_WRITE_ROLES)
}

function userFromMsg(msg) {
  return msg?._client?.user || msg?.socket?.user || msg?.user || null
}

function roleOf(user) {
  return user?.role || user?.permissions?.role || null
}

function userIdOf(user) {
  return user?.id || user?.username || user?.name || null
}

function numericLimit(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function configuredRateLimit(config = {}) {
  const value = config.rateLimit ?? config.maxDelta
  return numericLimit(value)
}

function writeValue(msg) {
  if (typeof msg?.payload !== 'object') return msg?.payload ?? null
  if (msg?.payload?.value !== undefined) return msg.payload.value
  if (msg?.payload?.setpoint !== undefined) return msg.payload.setpoint
  if (msg?.payload?.command !== undefined) return msg.payload.command
  if (msg?.payload?.mode !== undefined) return msg.payload.mode
  return null
}

function oldValue(msg) {
  if (msg?.payload?.oldValue !== undefined) return msg.payload.oldValue
  if (msg?.payload?.previous !== undefined) return msg.payload.previous
  if (msg?.payload?.current !== undefined) return msg.payload.current
  return null
}

function commandOf(msg) {
  return msg?.payload?.command || msg?.payload?.mode || msg?.payload?.action || null
}

function actionOf(msg) {
  return msg?.action || msg?.topic || msg?.payload?.action || 'faceplate.write'
}

function isControlIntent(msg) {
  const action = actionOf(msg)
  if (action.startsWith('pid.') || action.startsWith('motor.') || action.startsWith('valve.') || action.startsWith('alarm.')) {
    return true
  }
  const payload = msg?.payload
  return Boolean(payload && typeof payload === 'object' && (
    payload.setpoint !== undefined ||
    payload.command !== undefined ||
    payload.action !== undefined ||
    payload.confirmed !== undefined
  ))
}

function equipmentIdOf(msg, config = {}) {
  return msg?.payload?.equipmentId || msg?.payload?.equip || config.equipmentId || config.label || config.name || null
}

function activeInterlocks(msg) {
  const payload = msg?.payload || {}
  if (payload.interlock === true) return [{ id: 'interlock', label: 'Interlock active', blocks: ['*'] }]
  if (!Array.isArray(payload.interlocks)) return []
  return payload.interlocks.filter(item => item && item.active)
}

function interlockBlocks(msg) {
  const active = activeInterlocks(msg)
  if (!active.length) return false
  const command = commandOf(msg)
  return active.some(item => {
    if (!Array.isArray(item.blocks) || !item.blocks.length) return true
    return item.blocks.includes('*') || (command && item.blocks.includes(command))
  })
}

function shelveDurationMs(msg) {
  const value = msg?.payload?.durationMs ?? msg?.payload?.shelveMs
  const parsed = numericLimit(value)
  return parsed === null ? null : parsed
}

function correlationId(msg) {
  return msg?.payload?.correlationId || msg?.correlationId || `scada-${Date.now()}-${++nextCorrelation}`
}

function buildAudit(msg, user, config, result, reason) {
  const value = writeValue(msg)
  return {
    payload: {
      timestamp: Date.now(),
      ts: Date.now(),
      correlationId: correlationId(msg),
      user: userIdOf(user),
      role: roleOf(user),
      equipmentId: equipmentIdOf(msg, config),
      action: actionOf(msg),
      oldValue: oldValue(msg),
      newValue: value,
      payload: msg?.payload,
      confirmationResult: msg?.payload?.confirmed === false ? 'CANCELLED' : 'CONFIRMED',
      result,
      reason,
    },
  }
}

function authorizeWrite(msg, config = {}) {
  const action = actionOf(msg)
  const allowedRoles = getAllowedRoles(config, action)
  const user = userFromMsg(msg)
  const role = roleOf(user)

  if (!user || !allowedRoles.has(role)) {
    return {
      allowed: false,
      allowedMsg: null,
      auditMsg: buildAudit(msg, user, config, 'DENIED', 'role-not-authorized'),
    }
  }

  if (msg?.payload?.confirmed === false) {
    return {
      allowed: false,
      allowedMsg: null,
      auditMsg: buildAudit(msg, user, config, 'DENIED', 'not-confirmed'),
    }
  }

  if (interlockBlocks(msg)) {
    return {
      allowed: false,
      allowedMsg: null,
      auditMsg: buildAudit(msg, user, config, 'DENIED', 'interlock-active'),
    }
  }

  const value = writeValue(msg)
  const min = numericLimit(config.min)
  const max = numericLimit(config.max)

  if (typeof value === 'number' && min !== null && value < min) {
    return {
      allowed: false,
      allowedMsg: null,
      auditMsg: buildAudit(msg, user, config, 'DENIED', 'below-minimum'),
    }
  }

  if (typeof value === 'number' && max !== null && value > max) {
    return {
      allowed: false,
      allowedMsg: null,
      auditMsg: buildAudit(msg, user, config, 'DENIED', 'above-maximum'),
    }
  }

  const rateLimit = configuredRateLimit(config)
  const previous = oldValue(msg)
  if (typeof value === 'number' && typeof previous === 'number' && rateLimit !== null && Math.abs(value - previous) > rateLimit) {
    return {
      allowed: false,
      allowedMsg: null,
      auditMsg: buildAudit(msg, user, config, 'DENIED', 'rate-limit-exceeded'),
    }
  }

  if (action === 'alarm.shelve') {
    const duration = shelveDurationMs(msg)
    if (duration === null || duration <= 0 || duration > MAX_SHELVE_MS) {
      return {
        allowed: false,
        allowedMsg: null,
        auditMsg: buildAudit(msg, user, config, 'DENIED', 'invalid-shelve-duration'),
      }
    }
  }

  return {
    allowed: true,
    allowedMsg: msg,
    auditMsg: buildAudit(msg, user, config, 'ALLOWED', 'authorized'),
  }
}

module.exports = {
  DEFAULT_WRITE_ROLES,
  DEFAULT_ACK_ROLES,
  DEFAULT_SHELVE_ROLES,
  DEFAULT_OOS_ROLES,
  getAllowedRoles,
  isControlIntent,
  authorizeWrite,
}
