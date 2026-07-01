const DEFAULT_WRITE_ROLES = new Set(['operator', 'supervisor', 'engineer'])

function getAllowedRoles(config = {}) {
  if (!config.allowRoles) return DEFAULT_WRITE_ROLES
  const roles = String(config.allowRoles).split(',').map(r => r.trim()).filter(Boolean)
  return roles.length ? new Set(roles) : DEFAULT_WRITE_ROLES
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

function writeValue(msg) {
  if (typeof msg?.payload === 'number') return msg.payload
  if (typeof msg?.payload?.value === 'number') return msg.payload.value
  if (typeof msg?.payload?.setpoint === 'number') return msg.payload.setpoint
  return null
}

function buildAudit(msg, user, result, reason) {
  return {
    payload: {
      ts: Date.now(),
      user: userIdOf(user),
      role: roleOf(user),
      action: msg?.action || msg?.topic || msg?.payload?.action || 'faceplate-write',
      payload: msg?.payload,
      result,
      reason,
    },
  }
}

function authorizeWrite(msg, config = {}) {
  const allowedRoles = getAllowedRoles(config)
  const user = userFromMsg(msg)
  const role = roleOf(user)

  if (!user || !allowedRoles.has(role)) {
    return {
      allowed: false,
      allowedMsg: null,
      auditMsg: buildAudit(msg, user, 'DENIED', 'role-not-authorized'),
    }
  }

  const value = writeValue(msg)
  const min = numericLimit(config.min)
  const max = numericLimit(config.max)

  if (value !== null && min !== null && value < min) {
    return {
      allowed: false,
      allowedMsg: null,
      auditMsg: buildAudit(msg, user, 'DENIED', 'below-minimum'),
    }
  }

  if (value !== null && max !== null && value > max) {
    return {
      allowed: false,
      allowedMsg: null,
      auditMsg: buildAudit(msg, user, 'DENIED', 'above-maximum'),
    }
  }

  return {
    allowed: true,
    allowedMsg: msg,
    auditMsg: buildAudit(msg, user, 'ALLOWED', 'authorized'),
  }
}

module.exports = {
  DEFAULT_WRITE_ROLES,
  getAllowedRoles,
  authorizeWrite,
}
