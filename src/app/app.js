const process = require('process')
var FibApp = require('fib-app');

class App extends FibApp {
    constructor(url, opts) {
        super(url, opts)
        this.env = process.env.FIB_ENV
    }
    setupEnv(env) {
        this.env = env
    }
    getEnv() {
        return this.env
    }
}

module.exports = App;