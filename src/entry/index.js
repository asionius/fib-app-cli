const vm = require('vm');
const http = require('http');
const config = require('../config')
const utils = require('../utils')
const push = require('fib-push')
var app = require('../app')
var appPlugins = require('../plugins')

app.init(config, push)

var entry = {
    svr: null,
    appConfig: config,
    web_handler: () => {
        var sbox = new vm.SandBox({
            'push': push,
            'config': config,
            'app': app,
            'appPlugins': appPlugins
        }, utils.loadNativeModules2)

        return sbox.require('./app', __dirname)
    },
    setup: () => {
        entry.svr = new http.Server(config.server_port, entry.web_handler())
    },
    updateWebHandler: () => {
        var handler = entry.svr.handler
        try {
            var newhandler = entry.web_handler()
            handler = newhandler
            // console.log(`web handler updated ${++updatedCount} times`)
        } catch (e) {
            console.log(`web can not updated for ${++errorCount} times`)
            console.log(e);
        } finally {
            entry.svr.handler = handler
        }
    },
    start: (opts) => {
        var {
            async = false
        } = opts || {}
        console.info(`[fibjs:app] would start listening ${config.server_port}`)
        if (async) {
            entry.svr.run(() => {
                console.info(`[fibjs:app] stopped`)
                appPlugins.setupApp(null);
            })
        } else {
            entry.svr.run()
        }

    },
    stop: () => {
        entry.svr.stop()
    }
}
var updatedCount = 0
var errorCount = 0
module.exports = entry