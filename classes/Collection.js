const fs = require('fs');
const path = require('path');
const Document = require('./Document');

module.exports = class Collection {
    constructor(file, name, dir) {
        this.file = file;
        this.name = name;
        this.dir = dir;
        this.fpath = `${this.dir}/${this.file}`;
        this.documents = [];
        this.map = {};
        this.load();
    }

    load() {
        try {
            this.documents = JSON.parse(fs.readFileSync(this.fpath, 'utf8'));
            this.setUUID();
        } catch (error) {
            fs.writeFileSync(this.fpath, JSON.stringify([]));
        }
    }

    setUUID() {
        let modCount = 0;
        let newDocs = [];
        for (let i = 0; i < this.documents.length; i++) {
            const document = new Document(this.documents[i]);
            this.map[document._id] = document;
            newDocs.push(document);
            if (document.autosetid) {
                modCount++;
                delete document.autosetid;
            }
        }
        if (modCount) {
            this.documents = newDocs;
            this.sync();
        }
    }

    get(id) {
        return this.map[id];
    }

    sync() {
        fs.writeFileSync(this.fpath, JSON.stringify(this.documents, null, 0));
    }
}