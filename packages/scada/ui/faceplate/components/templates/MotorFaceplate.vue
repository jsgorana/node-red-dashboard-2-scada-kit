<template>
  <div class="faceplate-template">
    <div class="state-strip">
      <span>Speed</span>
      <strong>{{ valueOf('speed', '--') }} rpm</strong>
    </div>
    <div class="command-row">
      <button
        type="button"
        :disabled="blocked"
        @click="command('start', 'Start motor')"
      >
        Start
      </button>
      <button
        type="button"
        :disabled="blocked"
        @click="command('stop', 'Stop motor')"
      >
        Stop
      </button>
      <button
        type="button"
        :disabled="blocked"
        @click="command('reset', 'Reset motor fault')"
      >
        Reset
      </button>
    </div>
  </div>
</template>

<script>
export default {
    name: 'MotorFaceplate',

    props: {
        state: { type: Object, default: () => ({}) },
        blocked: { type: Boolean, default: false },
    },

    emits: ['write-request'],

    methods: {
        valueOf (key, fallback) {
            return this.state[key] ?? fallback
        },

        command (command, label) {
            this.$emit('write-request', {
                label,
                topic: 'motor.command',
                oldValue: this.state.status ?? null,
                payload: { command },
            })
        },
    },
}
</script>
