/**
 * @vitest-environment jsdom
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import UIScadaFaceplate from '../ui/faceplate/components/UIScadaFaceplate.vue'

function mountFaceplate(options = {}) {
  const socket = { emit: vi.fn() }
  const wrapper = mount(UIScadaFaceplate, {
    props: {
      id: 'faceplate-1',
      props: {
        label: 'P-101',
        template: 'motor',
        min: 0,
        max: 100,
        ...options.props,
      },
      state: {
        pv: 12.3,
        sp: 40,
        mode: 'AUTO',
        status: 'RUNNING',
        ...options.state,
      },
    },
    global: {
      provide: {
        $socket: socket,
      },
    },
  })
  return { wrapper, socket }
}

describe('UIScadaFaceplate write confirmation', () => {
  it('does not emit a control write before confirmation', async () => {
    const { wrapper, socket } = mountFaceplate()

    await wrapper.get('.command-row button').trigger('click')

    expect(socket.emit).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Confirm write')
  })

  it('emits widget-action only after confirmation', async () => {
    const { wrapper, socket } = mountFaceplate()

    await wrapper.get('.command-row button').trigger('click')
    await wrapper.get('.confirm-dialog .primary').trigger('click')

    expect(socket.emit).toHaveBeenCalledTimes(1)
    expect(socket.emit).toHaveBeenCalledWith('widget-action', 'faceplate-1', {
      action: 'motor.command',
      topic: 'motor.command',
      payload: {
        equipmentId: 'P-101',
        oldValue: 'RUNNING',
        value: 'start',
        confirmed: true,
        interlocks: [],
        permissives: [],
        command: 'start',
      },
    })
    expect(wrapper.text()).not.toContain('Confirm write')
  })

  it('cancels pending writes without emitting', async () => {
    const { wrapper, socket } = mountFaceplate()

    await wrapper.get('.command-row button').trigger('click')
    await wrapper.get('.confirm-dialog .secondary').trigger('click')

    expect(socket.emit).not.toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('Confirm write')
  })

  it('confirms PID setpoint writes with numeric payload', async () => {
    const { wrapper, socket } = mountFaceplate({
      props: { template: 'pid' },
      state: { sp: 55 },
    })

    await wrapper.get('input').setValue('62.5')
    await wrapper.get('.command-row button').trigger('click')
    await wrapper.get('.confirm-dialog .primary').trigger('click')

    expect(socket.emit).toHaveBeenCalledWith('widget-action', 'faceplate-1', {
      action: 'pid.setpoint',
      topic: 'pid.setpoint',
      payload: {
        equipmentId: 'P-101',
        oldValue: 55,
        value: 62.5,
        confirmed: true,
        interlocks: [],
        permissives: [],
        setpoint: 62.5,
      },
    })
  })

  it('renders ISA-18.2 alarm actions and emits ack requests after confirmation', async () => {
    const { wrapper, socket } = mountFaceplate({
      state: {
        alarm: {
          state: 'UNACK',
          priority: 'HIGH',
          message: 'High temperature',
          active: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Unacknowledged')
    expect(wrapper.text()).toContain('High - High temperature')

    await wrapper.get('.alarm-actions button').trigger('click')
    await wrapper.get('.confirm-dialog .primary').trigger('click')

    expect(socket.emit).toHaveBeenCalledWith('widget-action', 'faceplate-1', {
      action: 'alarm.ack',
      topic: 'alarm.ack',
      payload: expect.objectContaining({
        equipmentId: 'P-101',
        action: 'alarm.ack',
        confirmed: true,
        alarm: expect.objectContaining({ state: 'UNACK' }),
      }),
    })
  })

  it('disables command buttons when interlocks are active', () => {
    const { wrapper } = mountFaceplate({
      state: {
        interlocks: [{ id: 'low-flow', label: 'Low flow permissive', active: true, blocks: ['*'] }],
      },
    })

    expect(wrapper.text()).toContain('Low flow permissive')
    expect(wrapper.get('.command-row button').attributes('disabled')).toBeDefined()
  })
})
