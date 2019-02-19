const util = require('util')
const Session = require('fib-session')
const db = require('db')
const pool = require('fib-pool')

var _session = null;

exports.setupSession = (conn, opts) => {
    let _conn
    if (!conn)
        _conn = new util.LruCache(20000)
    else
        _conn = pool(() => db.open(conn), 10, 1 * 1000)
    _session = new Session(_conn, opts)
    _session.setup()
}
exports.getSessionService = () => {
    if (!_session)
        throw "session not initiated"
    return _session
}