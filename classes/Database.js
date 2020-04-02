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
        this.scan();
        self = this;
        if (opts.autosave) {
            self.intervalId = setInterval(() => {
                self.sync();
                self.scan();
            }, opts.interval || 60000);
        }
        return new Proxy(this, {
            get(target, property) {
                const prop = target[property];
                if (typeof(prop) === 'function') {
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
            set(target, property, value) {

            },
        });
    }
    
    readDir() {
        try {
            console.time('readDir');
            this.files = fs.readdirSync(this.dir, 'utf8');
            console.timeEnd('readDir');
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
            if (!this.collections[name]) {
                const collection = new Collection(file, name, this.dir);
                this.collections[name] = collection;
            }
        }
    }

    sync() {
        const collections = Object.values(self.collections);
        for (let i = 0; i < collections.length; i++) {
            collections[i].sync();
        }
    }

    scan() {
        this.readDir();
        this.loadCollections();
    }

    stop() {
        if (self.intervalId) {
            clearInterval(self.intervalId);
        }
    }
}