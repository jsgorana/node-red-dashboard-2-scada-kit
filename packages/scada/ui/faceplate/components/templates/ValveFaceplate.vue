<template>
  <div class="faceplate-template">
    <div class="state-strip">
      <span>Position</span>
      <strong>{{ valueOf('position', '--') }}%</strong>
    </div>
    <div class="command-row">
      <button
        type="button"
        @click="command('open', 'Open valve')"
      >
        Open
      </button>
      <button
        type="button"
        @click="command('close', 'Close valve')"
      >
        Close
      </button>
      <button
        type="button"
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
                payload: { command },
            })
        },
    },
}
</script>
