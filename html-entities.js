module.exports = function(RED) {
    "use strict";
    const he = require("he");

    function HeNode(config) {
        RED.nodes.createNode(this, config);
        this.mode = config.mode;

        let node = this;
        this.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) };

            if (msg.hasOwnProperty('payload')) {
                switch (node.mode) {
                    case 'encode':
                        msg.payload = he.encode(msg.payload);
                        break;
                    case 'escape':
                        msg.payload = he.escape(msg.payload);
                        if (done) done();
                        break;
                    case 'decode':
                    case 'unescape':
                        msg.payload = he.decode(msg.payload);
                        if (done) done();
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
        });
    }

    RED.nodes.registerType("html-entities", HeNode);
};
