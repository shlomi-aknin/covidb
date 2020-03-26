const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = class Document {
    constructor(data = {}) {
        this.data = data;
        if (!this.data._id) {
            this.data._id = crypto.randomBytes(16).toString('hex');
            this.data.autosetid = true;
        }
        return this.data;
    }
}