const fs = require('fs');
const Document = require('./Document');
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
        let modCount = 0;
        let tmp = {};
        for (let i = 0; i < this.documents.length; i++) {
            const document = new Document(this.documents[i]);
            tmp[document._id] = document;
            if (document.autoid) {
                modCount++;
                delete document.autoid;
            }
        }
        this.documents = tmp;
        tmp = {};
        if (modCount) {
            this.hasChanges = true;
            this.sync();
        }
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

    insert(docs) {
        switch (typeof docs) {
            case 'object':
                if (Array.isArray(docs)) {
                    for (let i = 0; i < docs.length; i++) {
                        const doc = docs[i];
                        this.insert(doc);
                    }
                } else {
                    const doc = new Document(docs);
                    delete doc.autoid;
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
            const document = documents[i].data;
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