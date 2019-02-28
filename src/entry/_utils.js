const {
    errorcode
} = require('../utils')

exports.ping = (req) => {
    req.response.json({
        status: 'ok'
    })
}
exports.notFound = (req, ext) => {
    req.response.statusCode = 404
    req.response.json(errorcode.fillError("没找到文件", ext).error)
}
exports.needLogin = (req) => {
    req.response.statusCode = 403
    req.response.json(errorcode.fillError("用户尚未登录, 请先登录").error)
}
exports.notPermit = (req, ext) => {
    req.response.statusCode = 403
    req.response.json(errorcode.fillError("没有访问权限", ext).error)
}