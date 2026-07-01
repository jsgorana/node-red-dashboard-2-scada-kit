<template>
  <div class="faceplate-template">
    <label class="setpoint-control">
      <span>Setpoint</span>
      <input
        v-model.number="draftSetpoint"
        type="number"
        :min="min"
        :max="max"
        step="0.1"
      >
    </label>
    <div class="command-row">
      <button
        type="button"
        @click="writeSetpoint"
      >
        Write SP
      </button>
      <button
        type="button"
        @click="mode('auto')"
      >
        Auto
      </button>
      <button
        type="button"
        @click="mode('manual')"
      >
        Manual
      </button>
    </div>
  </div>
</template>

<script>
export default {
    name: 'PIDFaceplate',

    props: {
        state: { type: Object, default: () => ({}) },
        min:   { type: Number, default: null },
        max:   { type: Number, default: null },
    },

    emits: ['write-request'],

    data () {
        return {
            draftSetpoint: this.state.sp ?? 0,
        }
    },

    watch: {
        'state.sp' (value) {
            if (value !== undefined && value !== null) this.draftSetpoint = value
        },
    },

    methods: {
        writeSetpoint () {
            this.$emit('write-request', {
                label: 'Write PID setpoint',
                topic: 'pid.setpoint',
                payload: { setpoint: this.draftSetpoint, value: this.draftSetpoint },
            })
        },

        mode (mode) {
            this.$emit('write-request', {
                label: `Set PID mode ${mode.toUpperCase()}`,
                topic: 'pid.mode',
                payload: { mode, command: mode },
            })
        },
    },
}
</script>
