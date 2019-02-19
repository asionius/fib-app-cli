const log_config = require('./log')
const VARS = require('./vars')
const process = require('process')

exports.log_config = log_config
exports.db_conn_str = VARS.db_conn_str
exports.session_conn_str = VARS.session_conn_str
exports.server_port = VARS.server_port
exports.isLocal = function (env) {
    return env === 'local'
}
exports.isProduction = function (env) {
    return env === 'production'
}

exports.isDev = function (env) {
    return env === 'dev'
}

exports.isTest = function (env) {
    return env === 'test'
}

exports.VARS = VARS