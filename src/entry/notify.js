const push = require('push')
const fs = require('fs')
const appPlugins = require('appPlugins')
const _utils = require('./_utils')
const jws = require('@fxjs/jws')
const {
    isTest
} = require('config')
const {
    constants
} = require('../isomorphic')
const {
    VARS
} = require('config')
VARS.loadKeyFiles()
const pubKey = fs.readTextFile(process.env.APP_API_PUBLIC_PEM_FILE_PATH)

function filterError(req, msg) {
    _utils.notPermit(req, msg)
    req.end()
}
exports.cookie_filter = (req) => {
    const app = appPlugins.AppStore.getApp()
    if (isTest(app.getEnv()))
        return
    const session = req.session
    if (!session.online) {
        filterError(req)
    }
}

exports.token_filter = (req) => {
    if (req.hasHeader(constants.AUTH_TOKEN)) {
        const token = req.firstHeader(constants.AUTH_TOKEN)
        let verified
        try {
            verified = jws.verify(token, pubKey)
        } catch (e) {
            filterError(req, 'token 格式有误')
            return true
        }
        if (!verified)
            filterError(req, 'token 验证失败')

        return true
    }
}

exports.filter = (req) => {
    if (exports.token_filter(req))
        return
    exports.cookie_filter(req)
}

exports.handler = (conn, req) => {
    conn.onmessage = msg => {
        var cmd = msg.json();
        switch (cmd[constants.WS_FORM_ACT]) {
            case 'on':
                let filter = function (d) {
                    return true
                }
                if (constants.WS_FORM_FILTER in cmd)
                    filter = function (d) {
                        return d.child == cmd[constants.WS_FORM_FILTER]
                    }
                push.on(cmd[constants.WS_FORM_CHANEL], conn, cmd[constants.WS_FORM_TIMESTAMP], filter)
                break;
            case 'off':
                push.off(cmd[constants.WS_FORM_CHANEL], conn)
                break;
        }
    }
}