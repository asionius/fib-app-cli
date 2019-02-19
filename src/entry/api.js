const _utils = require('./_utils')
const mq = require('mq')
const hash = require('hash')
const http = require('http')
const __utils = require('../app/_defs/_utils')
const jws = require('@fxjs/jws')
const fs = require('fs')
const process = require('process')
const {
    constants
} = require('../isomorphic')
const {
    VARS
} = require('config')

VARS.loadKeyFiles()
const pubKey = fs.readTextFile(process.env.APP_API_PUBLIC_PEM_FILE_PATH)

if (!pubKey)
    throw 'Failed to load key Files'

function filterError(req, msg) {
    console.error(msg)
    _utils.notPermit(req, msg)
    req.end()
}

exports.token_filter = (r) => {
    const token = r.firstHeader(constants.API_TOKEN)
    let verified
    try {
        verified = jws.verify(token, pubKey)
    } catch (e) {
        return filterError(r, 'token 格式有误')
    }
    if (!verified) {
        return filterError(r, 'token 验证失败')
    }
    const payload = new Buffer(token.split('.')[1], 'base64').toString()
    if (r.method === 'POST' || r.method === 'PUT') {
        const m = r.body.readAll().toString()
        if (payload !== m) {
            return filterError(r, 'payload decoded from token not equal to http payload')
        }
        r.body.rewind()
    } else {
        let m
        try {
            m = JSON.parse(payload)
        } catch (e) {
            return filterError(r, 'token 格式有误: {timestamp: [Number|String]}')
        }
        if (!m.timestamp || (new Date()).getTime() - (new Date(m.timestamp)).getTime() > (1000 * 60 * 10)) {
            return filterError(r, 'token 过期')
        }
    }

    r.session = __utils.getInternalReq({}).session
    console.log(`API: ${r.method} ${r.address} ${payload}`)
}

/* Difference:
 * use jws to sign hash of payload to minimize httppayload
 */
exports.token_filter2 = (r) => {
    const token = r.firstHeader(constants.API_TOKEN)
    let verified
    try {
        verified = jws.verify(token, pubKey)
    } catch (e) {
        return filterError(r, 'token 格式有误')
    }
    if (!verified) {
        return filterError(r, 'token 验证失败')
    }
    const payload = new Buffer(token.split('.')[1], 'base64').toString()
    if (r.method === 'POST' || r.method === 'PUT') {
        const m = r.body.readAll()
        if (JSON.parse(payload).hash !== hash.md5(m).digest('hex')) {
            return filterError(r, 'payload decoded from token not equal to http payload')
        }
        r.body.rewind()
    } else {
        let m
        try {
            m = JSON.parse(payload)
        } catch (e) {
            return filterError(r, 'token 格式有误: {timestamp: [Number|String]}')
        }
        if (!m.timestamp || (new Date()).getTime() - (new Date(m.timestamp)).getTime() > (1000 * 60 * 10)) {
            return filterError(r, 'token 过期')
        }
    }

    r.session = __utils.getInternalReq({}).session
    console.log(`API: ${r.method} ${r.address} ${payload}`)
}

exports.handler = (app) => {
    return function (v) {
        const r = new http.Request()
        r.method = v.method
        if (typeof v.headers === 'object' && Object.keys(v.headers).length) {
            r.setHeader(v.headers.toJSON())
        }
        r.address = r.value = v.value
        r.queryString = v.queryString
        r.session = v.session
        v.body.copyTo(r.body)
        mq.invoke(app, r)
        const p = r.response
        v.response.statusCode = p.statusCode
        v.response.json(p.json())
    }
}