<template>
  <div
    v-if="action"
    class="confirm-backdrop"
    role="presentation"
  >
    <section
      class="confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <h2 id="confirm-title">
        Confirm write
      </h2>
      <p>{{ action.label }}</p>
      <dl>
        <div>
          <dt>Topic</dt>
          <dd>{{ action.topic }}</dd>
        </div>
        <div>
          <dt>Value</dt>
          <dd>{{ valueText }}</dd>
        </div>
      </dl>
      <footer>
        <button
          type="button"
          class="secondary"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="primary"
          @click="$emit('confirm')"
        >
          Confirm
        </button>
      </footer>
    </section>
  </div>
</template>

<script>
export default {
    name: 'WriteConfirmDialog',

    props: {
        action: { type: Object, default: null },
    },

    emits: ['cancel', 'confirm'],

    computed: {
        valueText () {
            if (!this.action) return '--'
            const value = this.action.payload?.value ?? this.action.payload?.setpoint ?? this.action.payload?.command
            return value === undefined ? '--' : String(value)
        },
    },
}
</script>

<style scoped>
.confirm-backdrop {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 12px;
  background: rgba(33, 33, 33, 0.32);
}

.confirm-dialog {
  width: min(100%, 320px);
  padding: 12px;
  border: 1px solid var(--hmi-line-normal, #757575);
  background: var(--hmi-bg-panel, #eeeeee);
  color: var(--hmi-text-primary, #212121);
}

.confirm-dialog h2 {
  margin: 0 0 8px;
  font-size: 16px;
}

.confirm-dialog p {
  margin: 0 0 10px;
  font-size: 13px;
}

.confirm-dialog dl {
  display: grid;
  gap: 6px;
  margin: 0 0 12px;
}

.confirm-dialog div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.confirm-dialog dt {
  color: var(--hmi-text-label, #757575);
  font-size: 11px;
  font-weight: 700;
}

.confirm-dialog dd {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
}

.confirm-dialog footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.confirm-dialog button {
  min-width: 76px;
  min-height: 32px;
  border: 1px solid var(--hmi-line-normal, #757575);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.confirm-dialog .primary {
  background: var(--hmi-line-active, #424242);
  color: var(--hmi-bg-display, #f5f5f5);
}

.confirm-dialog .secondary {
  background: var(--hmi-bg-display, #f5f5f5);
  color: var(--hmi-text-primary, #212121);
}
</style>
