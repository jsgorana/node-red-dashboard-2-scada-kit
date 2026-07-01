const { authorizeWrite } = require('./rbac')

module.exports = function (RED) {
    function UIScadaFaceplateNode(config) {
        RED.nodes.createNode(this, config)
        const node = this
        config.includeClientData = true

        const group = RED.nodes.getNode(config.group)
        if (!group) {
            node.error('No group configured')
            return
        }

        const evts = {
            onAction: true,
            beforeSend: function (msg) {
                if (!msg?._client && !msg?.socket && !msg?.user) {
                    return msg
                }

                const result = authorizeWrite(msg, config)
                return [result.allowedMsg, result.auditMsg]
            },
            onInput: function (msg) {
                node.send([msg, null])
            },
        }

        group.register(node, config, evts)
    }

    RED.nodes.registerType('ui-scada-faceplate', UIScadaFaceplateNode)
}
