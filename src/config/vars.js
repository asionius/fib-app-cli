/*
APP_SERVER_PORT
APP_HOT_PLUGED
APP_CONN_STR
APP_DEV_CONN_STR
APP_TEST_CONN_STR
APP_LOG_PATH
APP_CONN_POOL_LIMIT
APP_SESSION_CONN_STR
APP_HOME
APP_MAIL_HOSTNAME
APP_MAIL_PORT
APP_MAIL_USERNAME
APP_MAIL_PASSWORD
APP_DPI_PROXY_ADDR
APP_API_PUBLIC_PEM_FILE_PATH
APP_API_PRIVATE_PEM_FILE_PATH
NODE_ENV
FIB_ENV
*/

const process = require('process')
const path = require('path')

var penv = process.env
var env = penv.FIB_ENV || 'dev'
penv.FIB_ENV = penv.FIB_ENV || env
penv.APP_SERVER_PORT = Number(penv.APP_SERVER_PORT) || 8081
penv.APP_HOT_PLUGED = penv.APP_HOT_PLUGED || false
penv.APP_HOME = penv.APP_HOME || penv.HOME
penv.APP_DEV_CONN_STR = penv.APP_DEV_CONN_STR || `sqlite:${penv.APP_HOME}/app.db`
penv.APP_TEST_CONN_STR = penv.APP_TEST_CONN_STR || `sqlite:${penv.APP_HOME}/test-app.db`
penv.APP_LOG_PATH = penv.APP_LOG_PATH || '/var/log/app.log'

exports.loadKeyFiles = () => {
    penv.APP_API_PUBLIC_PEM_FILE_PATH = penv.APP_API_PUBLIC_PEM_FILE_PATH || path.join(__dirname, './pem/rsa_public_key.pem')
    penv.APP_API_PRIVATE_PEM_FILE_PATH = penv.APP_API_PRIVATE_PEM_FILE_PATH || path.join(__dirname, './pem/rsa_private_key.pem')
}

var db_conn_str

switch (env) {
    case 'production':
        db_conn_str = penv.APP_CONN_STR
        break
    case 'test':
        db_conn_str = penv.APP_TEST_CONN_STR
        break
    case 'dev':
        db_conn_str = penv.APP_DEV_CONN_STR
        break
}

exports.env = env,
exports.server_port = penv.APP_SERVER_PORT,
exports.db_conn_str = db_conn_str,
exports.log_path = penv.APP_LOG_PATH,
exports.session_conn_str = penv.APP_SESSION_CONN_STR || db_conn_str