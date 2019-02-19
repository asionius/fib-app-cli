const test = require('test');
test.setup();
const process = require('process');
process.env.FIB_ENV = 'test'
require('../config')

const fs = require('fs');

const dbPath = process.env.APP_TEST_CONN_STR
try {
    fs.unlink(dbPath.substr(7));
} catch (e) {};
try {
    fs.unlink(`${dbPath}-shm`.substr(7));
} catch (e) {};
try {
    fs.unlink(`${dbPath}-wal`.substr(7));
} catch (e) {};

run('../')

run('./user')
run('./tableManage.js')

test.run(console.DEBUG);
process.exit();