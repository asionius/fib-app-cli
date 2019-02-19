const process = require('process')
const errorcode = require('./errorcode')
const formchecker = require('./formchecker')
const builtinModules = require('@fibjs/builtin-modules');

exports.formchecker = formchecker
exports.errorcode = errorcode
exports.smtp = require('./smtp')

exports.loadNativeModules = (vm) => {
    builtinModules.forEach((mo) => {
        vm.add(mo, require(mo))
    })
}

exports.loadNativeModules2 = (mo)=>{
    if(builtinModules.includes(mo))
        return require(mo)
}