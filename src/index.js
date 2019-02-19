const coroutine = require('coroutine')
const server = require('./entry')
const {
    isDev
} = require('./config')
const process = require('process')
const {
    AppStore
} = require('./plugins')

server.setup()

if (isDev(AppStore.getApp().env) && process.env.APP_HOT_PLUGED) {
    coroutine.start(() => {
        while (1) {
            coroutine.sleep(1000)
            server.updateWebHandler()
        }
    })
}

server.start({
    async: process.env.FIB_ENV === 'test' ? true : false
});