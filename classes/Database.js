const fs = require('fs');
const path = require('path');
const Collection = require('./Collection');

module.exports = class Database {
    constructor(opts = {}) {
        this.dir = opts.dir || path.resolve('db');
        this.files = [];
        this.collections = {};
        this.readDir();
        this.loadCollections();
        return new Proxy(this, {
            get(target, property) {
                const prop = target[property];
                if (typeof prop === 'function') {
                    return function (...args) {
                        prop.apply(this, args);
                    };
                } else {
                    if (target.collections[property]) {
                        return target.collections[property];
                    } else {
                        target.collections[property] = new Collection(property, property, target.dir);
                        return target.collections[property];
                    }
                }
            },
            set(obj, prop, value) {

            },
        });
    }
    
    readDir() {
        try {
            this.files = fs.readdirSync(this.dir, 'utf8');
        } catch (error) {
            try {
                fs.mkdirSync(this.dir);
                this.readDir();
            } catch (error) {
                throw Error(error);
            }
        }
    }

    loadCollections() {
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            const name = file.substr(0, file.lastIndexOf('.'));
            const collection = new Collection(file, name, this.dir);
            this.collections[name] = collection;
        }
    }
}