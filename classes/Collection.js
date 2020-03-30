const fs = require('fs');
const crypto = require('crypto');
const Util = require('./Util');

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
            fs.writeFileSync(this.fpath, JSON.stringify(Object.values(this.documents), null, 0));
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

    insert(docs) {
        switch (typeof docs) {
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

    find(search) {
        let matches = [];
        const documents = Object.values(this.documents);
        if (!search || !Util.isObject(search) || !Object.keys(search).length) {
            return documents;
        }
        docsLoop: for (let i = 0; i < documents.length; i++) {
            const document = documents[i];
            const keys = Object.keys(search);
            keysLoop: for (let j = 0; j < keys.length; j++) {
                const key = keys[j];
                if (Object.keys(document).indexOf(key) === -1) {
                    continue docsLoop;
                }
                const searchValue = search[key];
                const docValue = document[key];
                if (Util.isObject(searchValue)) {
                    
                } else {
                    if (Array.isArray(searchValue)) {
                        if (!Array.isArray(docValue) || !Util.equalArrays(docValue, searchValue)) {
                            continue docsLoop;
                        }
                    } else {
                        if (docValue !== searchValue) {
                            continue docsLoop;
                        }
                    }
                }
            }
            matches.push(document);
        }

        return matches;
    }
}