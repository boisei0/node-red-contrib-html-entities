module.exports = function(RED) {
    "use strict";
    const he = require("he");

    function HeNode(config) {
        RED.nodes.createNode(this, config);
        this.property = config.property || "payload";
        this.propertyType = config.propertyType || "msg";
        this.mode = config.mode;

        let node = this;

        /**
         * Get a property value as selected from a typedInput widget; capable of dealing with msg/flow/global property types.
         * @param {object} msg - the msg object to operate on
         * @param {string} prop - the property set by the typedInput
         * @param {string} propT - the property type as set by the typedInput
         * @returns {Promise<>}
         */
        function getValue(msg, prop, propT) {
            node.warn(`GET: ${msg} | ${prop} | ${propT}`);
            if (propT === 'msg') {
                return Promise.resolve(RED.util.getMessageProperty(msg, prop));
            }
            else if (propT === 'flow' || propT === 'global') {
                return new Promise(
                    (resolve, reject) => {
                        const ctxKey = RED.util.parseContextStore(prop);
                        node.context()[propT].get(ctxKey.key, ctxKey.store, (err, value) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(value);
                            }
                        });
                    }
                );
            }
        }

        /**
         * Set a value to the property selected in a typedInput widget; capable of dealing with msg/flow/global property types.
         * @param msg - the msg object to operate on
         * @param {string} prop - the property set by the typedInput
         * @param {string} propT - the property type as set by the typedInput
         * @param value - the value to set.
         * @returns {Promise<>}
         */
        function setValue(msg, prop, propT, value) {
            node.warn(`SET: ${msg} | ${prop} | ${propT} | ${value}`);

            if (propT === 'msg') {
                return Promise.resolve(RED.util.setMessageProperty(msg, prop, value, true));
            }
            else if (propT === 'flow' || propT === 'global') {
                return new Promise(
                    (resolve, reject) => {
                        const ctxKey = RED.util.parseContextStore(prop);
                        node.context()[propT].set(ctxKey.key, value, ctxKey.store, (err) => { // NOTE: does not match documentation but matches function signature
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve();
                            }
                        });
                    }
                );
            }
        }


        this.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node,arguments) };

            getValue(msg, node.property, node.propertyType).then(function (value) {
                if (value !== undefined) {
                    switch (node.mode) {
                        case 'encode':
                            return he.encode(value, {
                                strict: node.optionsStrict,
                                useNamedReferences: node.optionsUseNamedReferences,
                                decimal: node.optionsPreferDecimal,
                                encodeEverything: node.optionsEncodeEverything,
                                allowUnsafeSymbols: node.optionsAllowUnsafeSymbols
                            });
                        case 'escape':
                            return he.escape(value);
                        case 'decode':
                        case 'unescape':
                            return he.decode(value, {
                                strict: node.optionsStrict,
                                isAttributeValue: node.optionsIsAttributeValue
                            });
                        default:
                            const err = `The selected mode ${node.mode} is not known.`;
                            throw new Error(err);
                    }
                }
                else {
                    // value is undefined, pass through message object? At least flag done TODO: figure out and document
                    send(msg);
                    if (done) done();
                }
            }).then(function (value) {
                return setValue(msg, node.property, node.propertyType, value)
            }).then(function() {
                send(msg);
                done();
            }).catch(function (err) {
                if (done) {
                    // v1.0 and newer
                    done(err);
                }
                else {
                    // before v1.0
                    node.error(err, msg);
                }
            });
        });
    }

    RED.nodes.registerType("html-entities", HeNode);
};
