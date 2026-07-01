<template>
  <section
    class="nrdb-scada-faceplate"
    :aria-label="`${title} faceplate`"
  >
    <header class="faceplate-header">
      <span class="faceplate-title">{{ title }}</span>
      <span
        class="faceplate-state"
        :class="stateClass"
        aria-live="polite"
        aria-atomic="true"
      >{{ stateLabel }}</span>
    </header>

    <dl class="faceplate-values">
      <div>
        <dt>PV</dt>
        <dd aria-label="Process variable">
          {{ processValue }}
        </dd>
      </div>
      <div>
        <dt>SP</dt>
        <dd aria-label="Setpoint">
          {{ setpoint }}
        </dd>
      </div>
      <div>
        <dt>Mode</dt>
        <dd aria-label="Control mode">
          {{ mode }}
        </dd>
      </div>
    </dl>

    <component
      :is="templateComponent"
      class="template-host"
      :state="mergedState"
      :min="minSetpoint"
      :max="maxSetpoint"
      @write-request="requestWrite"
    />

    <WriteConfirmDialog
      :action="pendingAction"
      @cancel="cancelWrite"
      @confirm="confirmWrite"
    />
  </section>
</template>

<script>
import WriteConfirmDialog from './WriteConfirmDialog.vue'
import MotorFaceplate from './templates/MotorFaceplate.vue'
import ValveFaceplate from './templates/ValveFaceplate.vue'
import PIDFaceplate from './templates/PIDFaceplate.vue'

const TEMPLATES = {
    motor: MotorFaceplate,
    valve: ValveFaceplate,
    pid:   PIDFaceplate,
}

export default {
    name: 'UIScadaFaceplate',

    components: {
        WriteConfirmDialog,
        MotorFaceplate,
        ValveFaceplate,
        PIDFaceplate,
    },

    inject: {
        $socket:      { default: null },
        $dataTracker: { default: null },
    },

    props: {
        id:    { type: String, default: '' },
        props: { type: Object, default: () => ({}) },
        state: { type: Object, default: () => ({}) },
    },

    data () {
        return {
            pendingAction: null,
            liveState: {},
        }
    },

    computed: {
        title () {
            return this.props.name || this.props.label || this.id || 'Faceplate'
        },

        mergedState () {
            return { ...this.state, ...this.liveState }
        },

        stateLabel () {
            return this.mergedState.status || this.props.status || 'READY'
        },

        stateClass () {
            const s = this.stateLabel.toUpperCase()
            if (s === 'RUNNING') return 'state-running'
            if (s === 'STOPPED') return 'state-stopped'
            if (s === 'TRIPPED' || s === 'FAULT') return 'state-alarm'
            return ''
        },

        processValue () {
            return this.mergedState.pv ?? this.props.pv ?? '--'
        },

        setpoint () {
            return this.mergedState.sp ?? this.props.sp ?? '--'
        },

        mode () {
            return this.mergedState.mode || this.props.mode || 'MAN'
        },

        templateName () {
            return String(this.props.template || this.props.type || 'motor').toLowerCase()
        },

        templateComponent () {
            return TEMPLATES[this.templateName] || MotorFaceplate
        },

        minSetpoint () {
            const value = Number(this.props.min)
            return Number.isFinite(value) ? value : null
        },

        maxSetpoint () {
            const value = Number(this.props.max)
            return Number.isFinite(value) ? value : null
        },
    },

    created () {
        if (this.$dataTracker) {
            this.$dataTracker(this.id, this.onInput, this.onLoad)
        }
    },

    methods: {
        onLoad (msg) {
            if (msg?.payload && typeof msg.payload === 'object') {
                this.liveState = { ...this.liveState, ...msg.payload }
            }
        },

        onInput (msg) {
            if (msg?.payload && typeof msg.payload === 'object') {
                this.liveState = { ...this.liveState, ...msg.payload }
            }
        },

        requestWrite (action) {
            this.pendingAction = {
                label:   action.label || 'Write value',
                topic:   action.topic || 'faceplate.write',
                payload: action.payload || {},
            }
        },

        cancelWrite () {
            this.pendingAction = null
        },

        confirmWrite () {
            if (!this.pendingAction) return
            this.$socket?.emit('widget-action', this.id, {
                action:  this.pendingAction.topic,
                topic:   this.pendingAction.topic,
                payload: this.pendingAction.payload,
            })
            this.pendingAction = null
        },
    },
}
</script>

<style scoped>
.nrdb-scada-faceplate {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  overflow: hidden;
  background: var(--hmi-bg-panel, #eeeeee);
  color: var(--hmi-text-primary, #212121);
  font-family: Arial, sans-serif;
}

.faceplate-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 28px;
  border-bottom: 1px solid var(--hmi-line-normal, #757575);
}

.faceplate-title,
.faceplate-state {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
}

.faceplate-state { color: var(--hmi-text-secondary, #616161); }
.faceplate-state.state-running { color: var(--hmi-running, #1565c0); }
.faceplate-state.state-stopped { color: var(--hmi-stopped, #616161); }
.faceplate-state.state-alarm   { color: var(--hmi-alarm-high, #c62828); }

.faceplate-values {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.faceplate-values div { min-width: 0; }

.faceplate-values dt {
  color: var(--hmi-text-label, #757575);
  font-size: 10px;
  font-weight: 700;
}

.faceplate-values dd {
  margin: 2px 0 0;
  overflow: hidden;
  color: var(--hmi-text-value, #212121);
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-host {
  min-height: 0;
  flex: 1;
}

:deep(.faceplate-template) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

:deep(.state-strip) {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--hmi-line-normal, #757575);
  background: var(--hmi-bg-display, #f5f5f5);
  font-size: 12px;
}

:deep(.command-row) {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

:deep(button) {
  min-width: 0;
  min-height: 44px; /* WCAG 2.5.8 target size minimum */
  border: 1px solid var(--hmi-line-normal, #757575);
  background: var(--hmi-bg-display, #f5f5f5);
  color: var(--hmi-text-primary, #212121);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

:deep(button:focus-visible) {
  outline: 2px solid var(--hmi-line-active, #424242);
  outline-offset: 2px;
}

:deep(.setpoint-control) {
  display: grid;
  gap: 4px;
  color: var(--hmi-text-label, #757575);
  font-size: 11px;
  font-weight: 700;
}

:deep(input) {
  min-height: 32px;
  border: 1px solid var(--hmi-line-normal, #757575);
  padding: 4px 6px;
  background: var(--hmi-bg-display, #f5f5f5);
  color: var(--hmi-text-primary, #212121);
  font: inherit;
}

:deep(input:focus-visible) {
  outline: 2px solid var(--hmi-line-active, #424242);
  outline-offset: 1px;
}
</style>
