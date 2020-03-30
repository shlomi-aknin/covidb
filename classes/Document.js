const crypto = require('crypto');
module.exports = class Document {
    constructor(data = {}) {
        this.data = data;
        if (!this.data._id) {
            this.data._id = crypto.randomBytes(16).toString('hex');
            this.data.autoid = true;
            this.data.iat = Date.now();
        }
        return new Proxy(this, {
            get(target, property) {
                const prop = target[property];
                if (typeof prop === 'function') {
                    return function (...args) {
                        prop.apply(this, args);
                    };
                } else {
                    if (property === 'data') {
                        // return undefined;
                        return target.data;
                    }
                    return target.data[property] || undefined;
                }
            },
            set(target, property, value) {
                const forbidden = ['data', '_id', 'iat'];
                if (!forbidden.includes(property)) {
                    target.data[property] = value;
                }
            },
        });
    }

}