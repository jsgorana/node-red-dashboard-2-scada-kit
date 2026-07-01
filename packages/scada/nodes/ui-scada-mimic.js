const { sanitizeSVG } = require('../lib/index.cjs');
const { parse } = require('../lib/index.cjs');

module.exports = function (RED) {
    function UIScadaMimicNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const group = RED.nodes.getNode(config.group);
        if (!group) {
            node.error('No group configured');
            return;
        }

        // Sanitize SVG on load (server-side, before it ever reaches the client)
        if (config.svg) {
            config.svg = sanitizeSVG(config.svg);
        }

        // Validate binding config
        if (config.bindings) {
            try {
                const parsed = parse(JSON.parse(config.bindings));
                if (!parsed.valid) {
                    node.warn('Binding config errors: ' + parsed.errors.join('; '));
                }
            } catch {
                node.warn('Binding config is not valid JSON');
            }
        }

        const evts = {
            onAction: true,
            beforeSend: function (msg) {
                // Control intents arrive here from the Vue component via widget-action.
                // Downstream flow handles writing to controller — no processing here.
                return msg;
            },
            onInput: function (msg) {
                // Normalize scalar topic/payload to tag map (SRS §3.3):
                //   { topic: "P101.run", payload: true } → { payload: { "P101.run": true } }
                if (msg.topic && msg.payload !== null && msg.payload !== undefined
                        && typeof msg.payload !== 'object') {
                    msg.payload = { [msg.topic]: msg.payload };
                }
                // Re-sanitize any SVG override the flow might send dynamically.
                if (msg.payload && typeof msg.payload === 'object' && msg.payload.svg) {
                    msg.payload.svg = sanitizeSVG(msg.payload.svg);
                }
                node.send(msg);
            },
        };

        group.register(node, config, evts);
    }

    RED.nodes.registerType('ui-scada-mimic', UIScadaMimicNode);
};
