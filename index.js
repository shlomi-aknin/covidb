const Database = require('./classes/Database');
const db = new Database();

console.time('load');
console.log(db.colibration.get('4e938c14721b236d0be4a6f0fee7d5d6'));
console.timeEnd('load');