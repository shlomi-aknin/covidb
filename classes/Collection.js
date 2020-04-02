const fs = require('fs');
const crypto = require('crypto');
const Util = require('./Util');
const mingo = require('mingo');

module.exports = class Collection {
    constructor(file, name, dir) {
        this.hasChanges = false;
        this.file = file.indexOf('.json') === -1 ? `${file}.json` : file;
        this.name = name;
        this.dir = dir;
        this.fpath = `${this.dir}/${this.file}`;
        this.documents = {};
        this.load();
    }
    
    load() {
        try {
            this.documents = JSON.parse(fs.readFileSync(this.fpath, 'utf8'));
            this.map();
        } catch (error) {
            this.sync();
        }
    }

    map() {
        let tmp = {};
        for (let i = 0; i < this.documents.length; i++) {
            const document = this.documents[i];
            if (!document._id) {
                document._id = crypto.randomBytes(16).toString('hex');
                document.iat = Date.now();
                if (!this.hasChanges) {
                    this.hasChanges = true;
                }
            }
            tmp[document._id] = document;
        }
        this.documents = tmp;
        tmp = {};
        this.sync();
    }

    findById(id) {
        return this.documents[id];
    }

    sync() {
        if (this.hasChanges) {
            fs.writeFileSync(this.fpath, this.getDocs(true));
            this.hasChanges = false;
        }
    }

    initDoc(doc = {}) {
        if (!doc._id) {
            doc._id = crypto.randomBytes(16).toString('hex');
            doc.iat = Date.now();
        }

        return doc;
    }

    getDocs(str = false) {
        const docs = Object.values(this.documents);
        return str ? JSON.stringify(docs, null, 0) : docs;
    }

    insert(docs) {
        switch (typeof(docs)) {
            case 'object':
                if (Array.isArray(docs)) {
                    for (let i = 0; i < docs.length; i++) {
                        const doc = docs[i];
                        this.insert(doc);
                    }
                } else {
                    const doc = this.initDoc(docs);
                    this.documents[doc._id] = doc;
                    if (!this.hasChanges) {
                        this.hasChanges = true;
                    }
                }
                break;
            default:
                console.log('Only Object or Array is valid for insert to collection');
                break;
        }
    }

    find(search, opts = {}) {
        const documents = this.getDocs();
        if (!search || !Util.isObject(search) || !Object.keys(search).length) {
            return documents;
        }
        const cursor = mingo.find(documents, search);
        // while (cursor.hasNext()) {
        //     console.log(cursor.next());
        // }
        return cursor.all();
    }
}