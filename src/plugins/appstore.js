var _App = null

exports.setupApp = (app) => {
    _App = app
}
exports.getApp = () => {
    if (!_App)
        throw "IProbe app not setuped"
    return _App
}