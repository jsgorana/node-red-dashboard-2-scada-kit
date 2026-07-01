import assert from 'node:assert'
import { describe, it } from 'vitest'
import { STATES } from '../lib/alarm/fsm.js'
import { alarmView, availableAlarmActions, normalizeAlarm } from '../lib/alarm/view.js'

describe('Alarm view mapping', () => {
  it('normalizes missing alarms to normal low priority', () => {
    const alarm = normalizeAlarm()
    assert.strictEqual(alarm.state, STATES.NORMAL)
    assert.strictEqual(alarm.priority, 'LOW')
    assert.strictEqual(alarm.active, false)
  })

  it('marks unacknowledged alarms as action-required', () => {
    const view = alarmView({ state: STATES.UNACK, priority: 'HIGH', message: 'High level' })
    assert.strictEqual(view.label, 'Unacknowledged')
    assert.strictEqual(view.priorityLabel, 'High')
    assert.strictEqual(view.actionRequired, true)
    assert.ok(view.className.includes('alarm-unack'))
  })

  it('keeps shelved, suppressed, and out-of-service distinct', () => {
    assert.strictEqual(alarmView({ state: STATES.SHELVED }).label, 'Shelved')
    assert.strictEqual(alarmView({ state: STATES.SUPPRESSED_BY_DESIGN }).label, 'Suppressed by design')
    assert.strictEqual(alarmView({ state: STATES.OUT_OF_SERVICE }).label, 'Out of service')
  })

  it('exposes valid action availability by state', () => {
    assert.deepStrictEqual(availableAlarmActions({ state: STATES.UNACK }), {
      ack: true,
      shelve: true,
      unshelve: false,
      oosEnter: true,
      oosExit: false,
    })
    assert.strictEqual(availableAlarmActions({ state: STATES.SHELVED }).unshelve, true)
    assert.strictEqual(availableAlarmActions({ state: STATES.OUT_OF_SERVICE }).oosExit, true)
  })
})
