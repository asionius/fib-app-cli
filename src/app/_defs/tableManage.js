const _utils = require('./_utils')
const AppPlugins = require('appPlugins')
const {
    errorcode
} = require('../../utils');
const {
    CLASSES,
    classdesc
} = _utils

module.exports = (db) => {
    const Manage = db.define(CLASSES.TABLE_MANAGE, {
        tableName: {
            type: 'text',
            unique: true
        },
        description: {
            type: 'text'
        },
        hasinit: Boolean
    }, {
        ACL: (session) => {
            return {
                '*': false,
                roles: {
                    ..._utils.aclAllowInternalRole(),
                    ..._utils.aclAllowRole('superadmin'),
                    ..._utils.aclAllowRole('dev_ops')
                }
            }
        },
        functions: {
            getTables: (req, data) => {
                let app = AppPlugins.AppStore.getApp()
                let rs
                const nakedConn = _utils.getNakedConn(db)
                if (!require('config').isProduction(app.getEnv()))
                    rs = nakedConn.execute(`SELECT name FROM sqlite_master WHERE type='table';`)
                else
                    rs = nakedConn.execute(`select table_name name from information_schema.tables where table_schema=${process.env.database} and table_type='base table';`)
                rs = rs.filter((r) => {
                    if (r.name in classdesc) {
                        r.description = classdesc[r.name]
                        return true
                    }
                    return false
                })
                rs = rs.map((r) => {
                    req.query = {
                        where: {
                            tableName: r.name
                        }
                    }
                    let rs = app.api.find(req, db, _utils.getModelClass(db, CLASSES.TABLE_MANAGE))
                    let tb = rs.success[0]
                    if (!tb) {
                        let rs = app.api.post(req, db, _utils.getModelClass(db, CLASSES.TABLE_MANAGE), {
                            tableName: r.name,
                            description: r.description,
                            hasinit: false
                        })
                        _utils.checkErr(rs)
                        r.hasinit = false
                        return r
                    }
                    r.hasinit = tb.hasinit
                    return r;
                })
                return {
                    'success': rs
                }
            },
            initTableRole: (req, data) => {
                const {
                    tableName
                } = data
                if (!tableName)
                    return errorcode.fillError('提交的表格不完整', '[tableName]')
                let app = AppPlugins.AppStore.getApp()
                req.query = {
                    where: {
                        tableName: tableName
                    }
                }
                let rs = app.api.find(req, db, _utils.getModelClass(db, CLASSES.TABLE_MANAGE))
                let tb = rs.success[0]
                if (!tb)
                    return errorcode.fillError('内部错误')
                if (tb.hasinit)
                    return errorcode.fillOk()
                let _func = app.api.functionHandler(tableName, 'getRoles')
                rs = _func(req, db, _utils.getModelClass(db, tableName), {})
                _utils.checkErr(rs)
                
                let roles = rs.success
                const nakedConn = _utils.getNakedConn(db)
                try {
                    nakedConn.begin()
                    roles.forEach((r) => {
                        req.query = {
                            where: {
                                name: r.name
                            }
                        }
                        let rs = app.api.find(req, db, _utils.getModelClass(db, CLASSES.ROLE))
                        let item = rs.success[0]
                        if (!item) {
                            app.api.post(req, db, _utils.getModelClass(db, CLASSES.ROLE), {
                                name: r.name,
                                displayName: classdesc[tableName] + r.description,
                                description: classdesc[tableName] + r.description
                            })
                        }
                    })
                    tb.hasinit = true
                    tb.saveSync()
                    nakedConn.commit()
                } catch (e) {
                    console.error(e)
                    nakedConn.rollback()
                }
                return errorcode.fillOk()
            }
        }
    })
}