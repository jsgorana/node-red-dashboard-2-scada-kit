<template>
  <div class="faceplate-template">
    <div class="state-strip">
      <span>Position</span>
      <strong>{{ valueOf('position', '--') }}%</strong>
    </div>
    <div class="command-row">
      <button
        type="button"
        :disabled="blocked"
        @click="command('open', 'Open valve')"
      >
        Open
      </button>
      <button
        type="button"
        :disabled="blocked"
        @click="command('close', 'Close valve')"
      >
        Close
      </button>
      <button
        type="button"
        :disabled="blocked"
        @click="command('stop', 'Stop valve')"
      >
        Stop
      </button>
    </div>
  </div>
</template>

<script>
export default {
    name: 'ValveFaceplate',

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
                topic: 'valve.command',
                oldValue: this.state.status ?? this.state.position ?? null,
                payload: { command },
            })
        },
    },
}
</script>
