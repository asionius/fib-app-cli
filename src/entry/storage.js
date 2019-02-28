const hash = require('hash')
const _utils = require('./_utils')
const _UTILS = require('../app/_defs/_utils')
const appPlugins = require('appPlugins')
const {
    CLASSES
} = require('../isomorphic')

exports.session_filter = (v) => {
    if (!v.session || !v.session.online) {
        _utils.notPermit(v, '请先登录')
        v.end()
    }
}
exports.handler = (v, m) => {
    switch (m) {
        case '/upload':
            const app = appPlugins.AppStore.getApp()
            const form = v.form.toJSON()
            if (!('file' in form)) {
                return
            }
            const f = form.file.body.readAll()
            const hs = hash.md5(f).digest('hex').toString()
            const {
                fileName: name,
                contentType: type,
                width = null,
                height = null
            } = form.file
            let ret = app.dbPool((orm) => {
                let AttachInfo = _UTILS.getModelClass(orm, CLASSES.ATTACHINFO)
                let Attachment = _UTILS.getModelClass(orm, `${CLASSES.ATTACHINFO.toLowerCase()}_${CLASSES.ATTACHMENT.toLowerCase()}`)
                const _req = _UTILS.getInternalReq({})
                _req.query = {
                    where: {
                        hash: hs
                    }
                }
                let r = app.api.find(_req, orm, AttachInfo)
                _UTILS.checkErr(r)
                if (r.length > 0)
                    return hs
                r = app.api.post(_req, orm, AttachInfo, {
                    hash: hs,
                    name,
                    type,
                    size: f.length,
                    width,
                    height
                })
                _UTILS.checkErr(r)
                let aiid = r.success.id
                r = app.api.find(_req, orm, Attachment)
                _UTILS.checkErr(r)
                if (r.success.length === 0) {
                    Attachment.createSync({
                        [CLASSES.ATTACHINFO + '_id']: aiid,
                        hash: hs,
                        v: f
                    })
                }
                return hs
            })
            v.response.json({
                code: 200,
                data: {
                    path: process.env.APP_IMG_SERVER + "/f/" + ret
                }
            })
            break;
        case '/delete':
            const {
                hash: hsh
            } = v.json()
            app.dbPool((orm) => {
                let AttachInfo = _UTILS.getModelClass(orm, CLASSES.ATTACHINFO)
                let r = AttachInfo.findSync({
                    hash: hsh
                })
                if (r.length > 0)
                    return hsh
                r[0].isdeleted = true
                r[0].saveSync()
            })
            v.response.json({
                code: 200,
                message: 'ok'
            })
            break;

    }
}
exports.fileHandler = (v, m) => {
    if (v.firstHeader('If-Modified-Since')) {
        v.response.status = 304;
        return;
    }
    let hsh = m.substr(1)
    const app = appPlugins.AppStore.getApp()
    let ret = app.dbPool((orm) => {
        let AttachInfo = _UTILS.getModelClass(orm, CLASSES.ATTACHINFO)
        let Attachment = _UTILS.getModelClass(orm, `${CLASSES.ATTACHINFO.toLowerCase()}_${CLASSES.ATTACHMENT.toLowerCase()}`)
        let r = AttachInfo.findSync({
            hash: hsh,
            isdeleted: false
        })
        if (r.length === 0) {
            _utils.notFound(v, 'not found in attachinfo')
            return
        }
        r = Attachment.findSync({
            hash: hsh
        })
        if (r.length === 0) {
            _utils.notFound(v, 'not found in attachment')
            return
        }
        return r[0].v
    })
    v.response.addHeader('Last-Modified', 'Sat, 1 Dec 2018 00:00:00 GMT');
    v.response.addHeader('Cache-Control', "max-age=" + 10 * 365 * 24 * 60 * 60);
    v.response.body.write(ret)
}