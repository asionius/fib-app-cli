const http = require('http')
const ws = require('ws')
const path = require('path')
const rpc = require('./rpc')
const notify = require('./notify')
const api = require('./api')
const storage = require('./storage')
const proxy = require('./proxy')
const _utils = require('./_utils')
const fallback = require('./fallback')

var app = require('app')
var {
    sessionService,
    runtimeDir
} = require('appPlugins')

var app = app.setup(require('config'), require('../app/_defs'))

var router = {
    '/v1': app,
    '/api/v1(/.*)': [api.token_filter, api.handler(app)],
    '/api/v2(/.*)': [api.token_filter2, api.handler(app)],
    '/storage(/.*)': [storage.session_filter, storage.handler],
    '/f(/.*)': storage.fileHandler,
    '^/ping$': _utils.ping,
    '/push': [notify.filter, ws.upgrade(notify.handler)],
    '/rpc(/.*)': rpc,
    '/proxy': proxy,
    '*': [(v) => http.fileHandler(path.join(runtimeDir, './static')), fallback]
}

module.exports = [
    sessionService.getSessionService().cookie_filter,
    router
]