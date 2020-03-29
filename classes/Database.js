const fs = require('fs');
const path = require('path');
const Collection = require('./Collection');
const appDir = path.dirname(require.main.filename);
let self;

module.exports = class Database {
    constructor(opts = {}) {
        this.dir = path.resolve(appDir, opts.dir || 'db');
        this.files = [];
        this.collections = {};
        this.readDir();
        this.loadCollections();
        self = this;
        self.intervalId = setInterval(() => self.sync(), opts.interval || 60000);
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

    sync() {
        const collections = Object.values(self.collections);
        for (let i = 0; i < collections.length; i++) {
            collections[i].sync();
        }
    }

    stop() {
        clearInterval(self.intervalId);
    }
}