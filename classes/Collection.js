const fs = require('fs');
const path = require('path');
const Document = require('./Document');

module.exports = class Collection {
    constructor(file, name, dir) {
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
            if (document.autosetid) {
                modCount++;
                delete document.autosetid;
            }
        }
        this.documents = tmp;
        tmp = {};
        if (modCount) {
            this.sync();
        }
    }

    findById(id) {
        return this.documents[id];
    }

    sync() {
        fs.writeFileSync(this.fpath, JSON.stringify(Object.values(this.documents), null, 0));
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
                    delete doc.autosetid;
                    this.documents[doc._id] = doc;
                }
                break;
            default:
                console.log('Only Object or Array is valid for insert to collection');
                break;
        }
    }
}