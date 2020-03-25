const fs = require('fs');
const path = require('path');
const Collection = require('./Collection');

module.exports = class Database {
    constructor(opts = {}) {
        this.dir = opts.dir || path.resolve('db');
        this.files = [];
        this.readDir();
        this.loadCollections();
        return this;
    }

    readDir() {
        try {
            this.files = fs.readdirSync(this.dir, 'utf8');
        } catch (error) {
            throw Error(`Can't read ${this.dir}`);
        }
    }

    loadCollections() {
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            const name = file.substr(0, file.lastIndexOf('.'));
            const collection = new Collection(file, name, this.dir);
            this[name] = collection;
        }
    }
}