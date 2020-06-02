const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Util = require('./Util');
const mingo = require('mingo');
const idLength = 16;

module.exports = class Collection {
    constructor(file, name, dir) {
        this.hasChanges = false;
        this.file = path.extname(file) === '.json' ? file : `${file}.json`;
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
                document._id = crypto.randomBytes(idLength).toString('hex');
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

    commit() {
        this.hasChanges = true;
        this.sync();
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
                // Only Object or Array is valid for insert to collection
                break;
        }
        
        this.sync();
    }

    find(search) {
        const documents = this.getDocs();
        if (!search || !Util.isObject(search) || !Util.hasKeys(search)) {
            return documents;
        }
        const cursor = mingo.find(documents, search);
        
        return cursor.all();
    }

    get(docOrID) {
        const type = typeof(docOrID);
        if (type === 'string') {
            if (docOrID.length === idLength * 2) {
                return this.findById(docOrID);
            }
        }

        if (Util.isObject(docOrID)) {
            return this.find(docOrID);
        }

        if (Array.isArray(docOrID)) {
            return docOrID;
        }
    }

    delete(docOrID) {
        const docs = this.get(docOrID);
        if (Array.isArray(docs)) {
            for (let i = 0; i < docs.length; i++) {
                const doc = docs[i];
                this.deleteDoc(doc);
            }
        }

        if (Util.isObject(docs)) {
            this.deleteDoc(docs);
        }

        this.sync();
    }

    deleteDoc(doc) {
        if (doc) {
            delete this.documents[doc._id];
            if (!this.hasChanges) {
                this.hasChanges = true;
            }
        }
    }

    update(docOrID, update) {
        if (!Util.isObject(update) || !Util.hasKeys(update)) {
            return;
        }

        const docs = this.get(docOrID);
        if (Array.isArray(docs)) {
            for (let i = 0; i < docs.length; i++) {
                const doc = docs[i];
                this.updateSingle(doc, update);
            }
        }

        if (Util.isObject(docs)) {
            this.updateSingle(docs, update);
        }

        this.commit();
    }

    updateSingle(doc, update) {
        const unset = update['$unset'] || false;
        if (unset && Util.isObject(unset)) {
            doc = Util.deleteObjectProps(doc, unset);
            delete update['$unset'];
        }
        Object.assign(doc, update);
        this.documents[doc._id] = doc;
    }
}