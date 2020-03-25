const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = class Document {
    constructor(data = {}) {
        if (!data._id) {
            data._id = crypto.randomBytes(16).toString('hex');
            data.autosetid = true;
        }
        return data;
    }
}