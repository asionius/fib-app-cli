const rpc = require('fib-rpc')
const _utils = require('../app/_defs/_utils')
const UTILs = require('./_utils')

/* jr is abbreviation of Json Rpc, param should be an kv object. Such as:
 * {
 *     method: function (param) {
 *         return 1
 *     }   
 * }
 */
const jr = rpc.handler({
})

module.exports = function (req) {
    // check authority here
    if (!_utils.isAdmin(req.session)) {
        UTILs.notPermit(req)
        return req.end()
    }
    jr(req)
}