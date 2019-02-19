const {
    AppStore,
    sessionService,
    logService,
} = require('../plugins')

const App = require('./app')

exports.init = (config, push) => {
    logService.setupLogService(config.log_config)
    sessionService.setupSession(config.session_conn_str, {
        expires: 1000 * 60 * 60 * 24 * 30 * 2,
        timeout: 1000 * 60 * 60 * 24 * 7
    })
    if (push)
        push.config({
            idle_limit: 10,
            msg_limit: 10
        })
}

exports.setup = (config, defs) => {
    var app = new App(config.db_conn_str, {})
    app.db.use(defs)
    AppStore.setupApp(app)

    return app
}