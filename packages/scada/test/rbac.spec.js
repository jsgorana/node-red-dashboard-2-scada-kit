import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { authorizeWrite } = require('../nodes/rbac')

describe('ui-scada-faceplate RBAC', () => {
  it('denies unauthenticated writes by default and emits audit', () => {
    const result = authorizeWrite({ action: 'pid.setpoint', topic: '', payload: { value: 42 } }, { min: 0, max: 100 })

    expect(result.allowed).toBe(false)
    expect(result.allowedMsg).toBeNull()
    expect(result.auditMsg.payload.action).toBe('pid.setpoint')
    expect(result.auditMsg.payload.result).toBe('DENIED')
    expect(result.auditMsg.payload.reason).toBe('role-not-authorized')
  })

  it('denies users without write roles', () => {
    const result = authorizeWrite({
      topic: 'sp',
      payload: { value: 42 },
      _client: { user: { id: 'viewer-1', role: 'viewer' } },
    })

    expect(result.allowed).toBe(false)
    expect(result.auditMsg.payload.user).toBe('viewer-1')
    expect(result.auditMsg.payload.role).toBe('viewer')
  })

  it('allows operator writes in range and emits audit', () => {
    const msg = {
      topic: 'sp',
      payload: { value: 42 },
      _client: { user: { id: 'op-1', role: 'operator' } },
    }
    const result = authorizeWrite(msg, { min: 0, max: 100 })

    expect(result.allowed).toBe(true)
    expect(result.allowedMsg).toBe(msg)
    expect(result.auditMsg.payload.result).toBe('ALLOWED')
    expect(result.auditMsg.payload.reason).toBe('authorized')
  })

  it('rejects setpoints below range server-side', () => {
    const result = authorizeWrite({
      topic: 'sp',
      payload: { value: -1 },
      _client: { user: { id: 'eng-1', role: 'engineer' } },
    }, { min: 0, max: 100 })

    expect(result.allowed).toBe(false)
    expect(result.auditMsg.payload.reason).toBe('below-minimum')
  })

  it('rejects setpoints above range server-side', () => {
    const result = authorizeWrite({
      topic: 'sp',
      payload: { setpoint: 101 },
      _client: { user: { id: 'sup-1', role: 'supervisor' } },
    }, { min: 0, max: 100 })

    expect(result.allowed).toBe(false)
    expect(result.auditMsg.payload.reason).toBe('above-maximum')
  })
})
