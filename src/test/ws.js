const test = require('test')
test.setup()
const process = require('process')
const coroutine = require('coroutine')
const ws = require('ws')

const util = require('util')
const http = require('http')
const {
    CLASSES,
    EXTENDS,
    constants
} = require('../isomorphic')
const serverBase = `ws://127.0.0.1:${process.env.APP_SERVER_PORT}`

describe('ws', () => {
    let conn
    before(() => {
        let data = {
            act: "on",
            ch: `channel_1`,
            timestamp: 0
        }
        conn = new ws.Socket(`${serverBase}/push`)
        conn.onopen = () => {
            conn.send(JSON.stringify(data));
        }
        var r = [];

        conn.onmessage = m => {
            r.push(m.json());
        };
        coroutine.sleep(100);
        assert.equal(r.length, 1)
        assert.deepEqual(r[0], data)
    })
})