module.exports = function(RED) {
    "use strict";
    const he = require("he");

    function HeNode(config) {
        RED.nodes.createNode(this, config);
        this.property = config.property || "payload";
        this.mode = config.mode;

        let node = this;
        this.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) };

            const value = RED.util.getMessageProperty(msg,node.property);
            if (value !== undefined) {
                switch (node.mode) {
                    case 'encode':
                        RED.util.setMessageProperty(msg, node.property, he.encode(value));
                        break;
                    case 'escape':
                        RED.util.setMessageProperty(msg, node.property, he.escape(msg.payload));
                        break;
                    case 'decode':
                    case 'unescape':
                        RED.util.setMessageProperty(msg, node.property, he.decode(msg.payload));
                        break;
                    default:
                        const err = `The selected mode ${node.mode} is not known.`;
                        if (done) {
                            done(err);
                        } else {
                            node.error(err, msg);
                        }
                        return;
                }
                node.send(msg);
                if (done) done();
            }
            else {
                // pass through message unchanged
                node.send(msg);
                if (done) done();
            }
        });
    }

    RED.nodes.registerType("html-entities", HeNode);
};
