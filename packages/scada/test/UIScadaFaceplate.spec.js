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

    await wrapper.get('button').trigger('click')

    expect(socket.emit).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Confirm write')
  })

  it('emits widget-action only after confirmation', async () => {
    const { wrapper, socket } = mountFaceplate()

    await wrapper.get('button').trigger('click')
    await wrapper.get('.confirm-dialog .primary').trigger('click')

    expect(socket.emit).toHaveBeenCalledTimes(1)
    expect(socket.emit).toHaveBeenCalledWith('widget-action', 'faceplate-1', {
      action: 'motor.command',
      topic: 'motor.command',
      payload: { command: 'start' },
    })
    expect(wrapper.text()).not.toContain('Confirm write')
  })

  it('cancels pending writes without emitting', async () => {
    const { wrapper, socket } = mountFaceplate()

    await wrapper.get('button').trigger('click')
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
    await wrapper.get('button').trigger('click')
    await wrapper.get('.confirm-dialog .primary').trigger('click')

    expect(socket.emit).toHaveBeenCalledWith('widget-action', 'faceplate-1', {
      action: 'pid.setpoint',
      topic: 'pid.setpoint',
      payload: { setpoint: 62.5, value: 62.5 },
    })
  })
})
