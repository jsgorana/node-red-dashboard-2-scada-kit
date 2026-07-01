<template>
  <div class="nrdb-scada-mimic">
    <div
      v-if="commLoss"
      class="mimic-comm-loss"
    >
      No data — communication loss
    </div>
    <div
      ref="svgContainer"
      class="mimic-svg-container"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { sanitizeSVG, createMutationGuard, parse, evaluate } from '../../../lib/client.js'

export default {
    name: 'UIScadaMimic',

    inject: ['$dataTracker', '$socket'],

    props: {
        id:    { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: { type: Object, default: () => ({}) },
    },

    data () {
        return {
            commLoss: false,
            commLossTimer: null,
            mutationGuard: null,
            parsedBindings: [],
            parsedEvents:   [],
            eventListeners: [],  // [{ el, type, fn }] for cleanup
        }
    },

    computed: {
        ...mapState('data', ['messages']),

        latestMsg () {
            return this.messages[this.id]
        },

        commLossTimeout () {
            return this.props.commLossTimeout || 10000
        },
    },

    watch: {
        latestMsg (msg) {
            if (!msg) return
            this.resetCommLossTimer()
            this.applyBindings(msg.payload)
        },
    },

    created () {
        // Parse binding config once from props
        if (this.props.bindings) {
            try {
                const result = parse(JSON.parse(this.props.bindings))
                this.parsedBindings = result.bindings
                this.parsedEvents   = result.events
            } catch {
                // Malformed JSON — bindings stay empty, SVG still renders
            }
        }

        // Register with Dashboard data tracker
        this.$dataTracker(this.id, this.onInput, this.onLoad)
    },

    mounted () {
        this.renderSVG()
        this.resetCommLossTimer()
        const container = this.$refs.svgContainer
        if (container) {
            this.mutationGuard = createMutationGuard(container)
        }
    },

    unmounted () {
        clearTimeout(this.commLossTimer)
        if (this.mutationGuard) this.mutationGuard.disconnect()
        this.removeEventListeners()
    },

    methods: {
        onLoad (msg) {
            if (msg?.payload) this.applyBindings(msg.payload)
        },

        onInput (msg) {
            if (msg?.payload) {
                this.resetCommLossTimer()
                this.applyBindings(msg.payload)
            }
        },

        renderSVG () {
            const container = this.$refs.svgContainer
            if (!container || !this.props.svg) return

            // Client-side sanitize before DOM insertion — never trust server alone
            container.innerHTML = sanitizeSVG(this.props.svg)

            // Attach event listeners declared in the bindings events[] config
            this.removeEventListeners()
            this.attachEventListeners(container)
        },

        applyBindings (tagMap) {
            const container = this.$refs.svgContainer
            if (!container || !tagMap) return

            for (const binding of this.parsedBindings) {
                const tagValue = tagMap[binding.source]
                const value = evaluate(binding, tagValue ?? null)
                if (value === null) continue

                const elements = container.querySelectorAll(binding.selector)
                if (!elements.length) continue

                elements.forEach(el => this.applyToElement(el, binding.target, value))
            }
        },

        applyToElement (el, target, value) {
            switch (target.type) {
            case 'text':
                el.textContent = value
                break
            case 'style':
                if (target.name) el.style[target.name] = value
                break
            case 'attribute':
                if (target.name) el.setAttribute(target.name, value)
                break
            case 'visibility':
                el.style.display = (value === 'true' || value === true) ? '' : 'none'
                break
            case 'level': {
                // value is 0–100 (percent). Drives SVG rect height from bottom up.
                const pct = Math.max(0, Math.min(100, parseFloat(value)))
                const maxPx = parseFloat(target.max ?? 100)
                const fillPx = (pct / 100) * maxPx
                // Cache original y so repeated calls don't drift
                if (!el.hasAttribute('data-y0')) {
                    el.setAttribute('data-y0', el.getAttribute('y') ?? '0')
                }
                const y0 = parseFloat(el.getAttribute('data-y0'))
                el.setAttribute('height', String(fillPx))
                el.setAttribute('y', String(y0 + maxPx - fillPx))
                break
            }
            case 'transform':
                if (target.name === 'rotate') {
                    const bbox = el.getBBox?.() || { x: 0, y: 0, width: 0, height: 0 }
                    const cx = bbox.x + bbox.width / 2
                    const cy = bbox.y + bbox.height / 2
                    el.setAttribute('transform', `rotate(${value},${cx},${cy})`)
                } else {
                    el.setAttribute('transform', `${target.name || 'translate'}(${value})`)
                }
                break
            }
        },

        attachEventListeners (container) {
            for (const evt of this.parsedEvents) {
                const elements = container.querySelectorAll(evt.selector)
                elements.forEach(el => {
                    // Make element keyboard-accessible (WCAG 2.1.1)
                    if (!el.getAttribute('tabindex')) el.setAttribute('tabindex', '0')
                    if (!el.getAttribute('role'))     el.setAttribute('role', 'button')

                    const handler = (e) => {
                        if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return
                        this.$socket?.emit('widget-action', this.id, {
                            topic: evt.emit.topic,
                            payload: evt.emit.payload ?? {},
                        })
                    }

                    el.addEventListener(evt.action, handler)
                    el.addEventListener('keydown', handler)
                    this.eventListeners.push({ el, type: evt.action, fn: handler })
                    this.eventListeners.push({ el, type: 'keydown',  fn: handler })
                })
            }
        },

        removeEventListeners () {
            for (const { el, type, fn } of this.eventListeners) {
                el.removeEventListener(type, fn)
            }
            this.eventListeners = []
        },

        resetCommLossTimer () {
            this.commLoss = false
            clearTimeout(this.commLossTimer)
            this.commLossTimer = setTimeout(() => {
                this.commLoss = true
                // Apply no-feedback style to all bound elements
                this.applyCommLoss()
            }, this.commLossTimeout)
        },

        applyCommLoss () {
            const container = this.$refs.svgContainer
            if (!container) return
            for (const binding of this.parsedBindings) {
                const fallback = binding.transform?.quality?.onBad || binding.transform?.default
                if (!fallback) continue
                container.querySelectorAll(binding.selector).forEach(el => {
                    this.applyToElement(el, binding.target, fallback)
                })
            }
        },
    },
}
</script>

<style scoped>
/* Fill the .nrdb-ui-widget wrapper (which is position:relative) and take
   ourselves OUT OF FLOW. This is the critical bit: Dashboard's grid uses
   grid-auto-rows: minmax(48px, auto), so any in-flow content taller than the
   widget's row span would push the row to grow — the widget would resize to
   the SVG instead of obeying the size picker. Absolute positioning contributes
   zero intrinsic height, so the widget locks to exactly (height rows x 48px). */
.nrdb-scada-mimic {
  position: absolute;
  inset: 0;
  background: var(--hmi-bg-display, #f5f5f5);
  overflow: hidden;
}

.mimic-svg-container {
  position: absolute;
  inset: 0;
}

/* SVG is absolutely positioned with inset:0 so it gets a DEFINITE width AND
   height from the offsets (not a percentage that has to resolve through a
   flex/auto-height chain — that's what let it size by width*aspect-ratio and
   overflow). Its viewBox + default preserveAspectRatio ("xMidYMid meet")
   letterbox-contains the content inside this fixed box, centered, undistorted. */
.mimic-svg-container > :deep(svg) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.mimic-comm-loss {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 4px 8px;
  background: rgba(189, 189, 189, 0.85);
  color: #333;
  font-size: 0.75rem;
  text-align: center;
}
</style>
