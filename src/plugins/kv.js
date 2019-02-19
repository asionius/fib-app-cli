const pool = require('fib-pool')
const db = require('db')
const kv = require('fib-kv')

let kvs
exports.setup = (conn, opt) => {
    kvs = new kv(pool(() => {
        return db.open(conn)
    }), opt)
    kvs.setup()
}
exports.getKvs = () => {
    if (!kvs)
        throw "kvs was not setuped"
    return kvs
}