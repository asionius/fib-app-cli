let appErrCount = 0

function _genAppError() {
    const string = `4000${(appErrCount++%1000).toString().padStart(3, '0')}`
    return parseInt(string)
}

let statusErrCount = 0

function _genStatusError() {
    const string = `5000${(statusErrCount++%1000).toString().padStart(3, '0')}`
    return parseInt(string)
}

const errorCodeMap = {
    '缺少用户名或密码': _genAppError(),
    '用户名不存在': _genAppError(),
    '密码不正确': _genAppError(),
    '旧密码不正确': _genAppError(),
    '用户缺少初始角色': _genAppError(),
    '退出登录失败: 缺少用户session': _genAppError(),
    '提交的表格不完整': _genAppError(),
    '请联系管理员注册': _genAppError(),
    '提交内容格式有误': _genAppError(),
    '没有访问权限': _genAppError(),
    '用户尚未登录, 请先登录': _genAppError(),
    '内部错误': _genStatusError(),
    '数据查询服务发生错误': _genStatusError()
}

exports.fillError = (msg, extra) => {
    if(!(msg) in errorCodeMap)
        throw `unknown app error ${msg}, not recorded`
    if(extra)
        extra = `: ${extra}`
    else extra = ""

    return {
        error: {
            code: errorCodeMap[msg],
            message: `${msg}${extra}`
        }
    }
}
exports.fillOk = (msg) => {
    return {
        success: {
            message: msg || 'ok',
            data: null
        }
    }
}
exports.fillData = (data) => {
    return {
        success: {
            message: 'ok',
            data: data
        }
    }
}