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

    <section
      class="alarm-panel"
      :class="alarm.className"
      aria-live="polite"
      aria-atomic="true"
    >
      <div class="alarm-summary">
        <span
          class="alarm-shape"
          aria-hidden="true"
        >{{ alarmShape }}</span>
        <div>
          <strong>{{ alarm.label }}</strong>
          <span>{{ alarm.priorityLabel }}{{ alarm.message ? ` - ${alarm.message}` : '' }}</span>
        </div>
      </div>
      <div class="alarm-actions">
        <button
          type="button"
          :disabled="!alarmActions.ack"
          @click="requestAlarmAction('alarm.ack', 'Acknowledge alarm')"
        >
          Ack
        </button>
        <button
          type="button"
          :disabled="!alarmActions.shelve"
          @click="requestAlarmAction('alarm.shelve', 'Shelve alarm', { durationMs: shelveDurationMs })"
        >
          Shelve
        </button>
        <button
          type="button"
          :disabled="!alarmActions.unshelve"
          @click="requestAlarmAction('alarm.unshelve', 'Unshelve alarm')"
        >
          Unshelve
        </button>
        <button
          type="button"
          :disabled="!alarmActions.oosEnter && !alarmActions.oosExit"
          @click="requestAlarmAction(alarmActions.oosExit ? 'alarm.oos.exit' : 'alarm.oos.enter', alarmActions.oosExit ? 'Return alarm to service' : 'Place alarm out of service')"
        >
          OOS
        </button>
      </div>
    </section>

    <section
      v-if="interlocks.length || permissives.length"
      class="blocking-panel"
    >
      <div
        v-for="item in interlocks"
        :key="`i-${item.id}`"
        class="blocking-row active"
      >
        <span>Interlock</span>
        <strong>{{ item.label }}</strong>
      </div>
      <div
        v-for="item in permissives"
        :key="`p-${item.id}`"
        class="blocking-row"
        :class="{ active: !item.ok }"
      >
        <span>Permissive</span>
        <strong>{{ item.label }}</strong>
      </div>
    </section>

    <component
      :is="templateComponent"
      class="template-host"
      :state="mergedState"
      :min="minSetpoint"
      :max="maxSetpoint"
      :blocked="commandsBlocked"
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
import { alarmView, availableAlarmActions } from '../../../lib/alarm/view.js'

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

        equipmentId () {
            return this.props.equipmentId || this.props.label || this.props.name || this.id
        },

        alarm () {
            return alarmView(this.mergedState.alarm)
        },

        alarmActions () {
            return availableAlarmActions(this.mergedState.alarm)
        },

        alarmShape () {
            if (this.alarm.shape === 'none') return 'OK'
            if (this.alarm.shape === 'pause') return 'II'
            if (this.alarm.shape === 'slash') return '/'
            if (this.alarm.shape === 'wrench') return 'OOS'
            return '!'
        },

        shelveDurationMs () {
            const value = Number(this.props.shelveDurationMs)
            return Number.isFinite(value) && value > 0 ? value : 30 * 60 * 1000
        },

        interlocks () {
            if (Array.isArray(this.mergedState.interlocks)) {
                return this.mergedState.interlocks
                    .filter(item => item && item.active)
                    .map(item => ({ id: item.id || item.label, label: item.label || item.id || 'Interlock active' }))
            }
            return this.mergedState.interlock ? [{ id: 'interlock', label: 'Interlock active' }] : []
        },

        permissives () {
            if (!Array.isArray(this.mergedState.permissives)) return []
            return this.mergedState.permissives.map(item => ({
                id:    item.id || item.label,
                label: item.label || item.id || 'Permissive',
                ok:    item.ok !== false,
            }))
        },

        commandsBlocked () {
            return this.interlocks.length > 0 || this.permissives.some(item => !item.ok)
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
            const value = action.payload?.value ?? action.payload?.setpoint ?? action.payload?.command ?? action.payload?.mode
            const old = action.oldValue ?? this.currentValueFor(action.topic)
            this.pendingAction = {
                label:       action.label || 'Write value',
                topic:       action.topic || 'faceplate.write',
                oldValue:    old,
                newValue:    value,
                equipmentId: this.equipmentId,
                payload:     {
                    equipmentId:        this.equipmentId,
                    oldValue:           old,
                    value,
                    confirmed:          true,
                    interlocks:         this.mergedState.interlocks || [],
                    permissives:        this.mergedState.permissives || [],
                    ...(action.payload || {}),
                },
            }
        },

        requestAlarmAction (topic, label, extra = {}) {
            this.requestWrite({
                label,
                topic,
                payload: {
                    action: topic,
                    alarm:  this.mergedState.alarm || {},
                    ...extra,
                },
            })
        },

        currentValueFor (topic) {
            if (topic === 'pid.setpoint') return this.mergedState.sp ?? null
            if (topic === 'pid.mode') return this.mergedState.mode ?? null
            if (topic?.includes('command')) return this.mergedState.status ?? null
            return null
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

.alarm-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 6px;
  border: 1px solid var(--hmi-line-normal, #757575);
  background: var(--hmi-bg-display, #f5f5f5);
}

.alarm-summary {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.alarm-summary div {
  display: grid;
  min-width: 0;
}

.alarm-summary strong,
.alarm-summary span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
}

.alarm-shape {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 2px solid var(--hmi-line-normal, #757575);
  color: var(--hmi-text-primary, #212121);
  font-size: 10px;
  font-weight: 800;
}

.alarm-actions {
  display: grid;
  grid-template-columns: repeat(4, 44px);
  gap: 4px;
}

.alarm-actions button {
  min-width: 44px;
  min-height: 32px;
  font-size: 10px;
}

.alarm-unack .alarm-shape,
.alarm-rtn-unack .alarm-shape {
  border-color: var(--hmi-alarm-unack, #f44336);
  color: var(--hmi-alarm-unack, #f44336);
}

.alarm-shelved .alarm-shape,
.alarm-suppressed .alarm-shape {
  border-color: var(--hmi-alarm-shelved, #9c27b0);
  color: var(--hmi-alarm-shelved, #9c27b0);
}

.alarm-oos .alarm-shape {
  border-color: var(--hmi-alarm-oos, #607d8b);
  color: var(--hmi-alarm-oos, #607d8b);
}

.blocking-panel {
  display: grid;
  gap: 4px;
}

.blocking-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 6px;
  border: 1px solid var(--hmi-line-normal, #757575);
  background: var(--hmi-bg-display, #f5f5f5);
  font-size: 11px;
}

.blocking-row.active {
  border-color: var(--hmi-alarm-med, #ff9800);
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

:deep(button:disabled) {
  cursor: not-allowed;
  opacity: 0.52;
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
