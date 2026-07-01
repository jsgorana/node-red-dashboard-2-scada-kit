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
    expect(result.auditMsg.payload.correlationId).toMatch(/^scada-/)
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

  it('rejects writes that exceed the configured rate of change', () => {
    const result = authorizeWrite({
      topic: 'sp',
      payload: { value: 75, oldValue: 50 },
      _client: { user: { id: 'op-1', role: 'operator' } },
    }, { min: 0, max: 100, rateLimit: 10 })

    expect(result.allowed).toBe(false)
    expect(result.auditMsg.payload.reason).toBe('rate-limit-exceeded')
    expect(result.auditMsg.payload.oldValue).toBe(50)
    expect(result.auditMsg.payload.newValue).toBe(75)
  })

  it('rejects writes blocked by an active interlock server-side', () => {
    const result = authorizeWrite({
      topic: 'motor.command',
      payload: {
        command: 'start',
        interlocks: [{ id: 'guard', label: 'Guard open', active: true, blocks: ['start'] }],
      },
      _client: { user: { id: 'op-1', role: 'operator' } },
    })

    expect(result.allowed).toBe(false)
    expect(result.auditMsg.payload.reason).toBe('interlock-active')
  })

  it('requires elevated roles for alarm shelving', () => {
    const result = authorizeWrite({
      topic: 'alarm.shelve',
      payload: { action: 'alarm.shelve', durationMs: 60000 },
      _client: { user: { id: 'op-1', role: 'operator' } },
    })

    expect(result.allowed).toBe(false)
    expect(result.auditMsg.payload.reason).toBe('role-not-authorized')
  })

  it('allows supervisor alarm shelving with a bounded duration', () => {
    const result = authorizeWrite({
      topic: 'alarm.shelve',
      payload: { action: 'alarm.shelve', durationMs: 60000, equipmentId: 'TIC-101' },
      _client: { user: { id: 'sup-1', role: 'supervisor' } },
    })

    expect(result.allowed).toBe(true)
    expect(result.auditMsg.payload.equipmentId).toBe('TIC-101')
    expect(result.auditMsg.payload.action).toBe('alarm.shelve')
  })

  it('rejects invalid shelve durations', () => {
    const result = authorizeWrite({
      topic: 'alarm.shelve',
      payload: { action: 'alarm.shelve', durationMs: 0 },
      _client: { user: { id: 'sup-1', role: 'supervisor' } },
    })

    expect(result.allowed).toBe(false)
    expect(result.auditMsg.payload.reason).toBe('invalid-shelve-duration')
  })
})
