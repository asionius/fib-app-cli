const util = require('util')
const {
    CLASSES,
    EXTENDS,
    constants,
    classdesc
} = require('../../isomorphic')

exports.CLASSES = CLASSES
exports.EXTENDS = EXTENDS
exports.constants = constants
exports.classdesc = classdesc

exports.getClassProperties = (db, cls) => {
    return db.models[cls].properties
}

exports.getClassExtends = (db, cls) => {
    return db.models[cls].extends
}

exports.getModelClass = (db, cls) => {
    const r = db.models[cls]
    if (!r)
        throw `cls: ${cls} not found in db models`
    return r
}

exports.dbTransaction = (db, cb) => {
    return db.trans(cb)
}

exports.aclAllowInternalRole = () => {
    return {
        'internal': {
            '*': true,
            'extends': {
                '*': {
                    '*': true
                }
            }
        }
    }
}

exports.aclAllowRoleWithoutExtends = (role) => {
    return {
        [role]: {
            '*': true
        }
    }
}

exports.aclAllowRole = (role) => {
    return {
        [role]: {
            '*': true,
            'extends': {
                '*': {
                    '*': true
                }
            }
        }
    }
}

exports.aclAllowReadOnlyRoleWithoutExtends = (role) => {
    return {
        [role]: {
            'read': true,
            'find': true,
        }
    }
}

exports.aclAllowReadOnlyRole = (role) => {
    return {
        [role]: {
            'read': true,
            'find': true,
            'extends': {
                '*': {
                    'read': true,
                    'find': true,
                }
            }
        }
    }
}

exports.getInternalReq = (userInstance) => {
    userInstance = userInstance || {}
    return {
        session: {
            id: userInstance.id,
            roles: ['internal']
        },
        query: {}
    }
}

exports.checkErr = (r) => {
    if (r.error)
        throw r.error
}

exports.getUserRoles = (app, req, db, uid) => {
    const roles = []
    const r = app.api.efind(req, db, exports.getModelClass(db, exports.CLASSES.USER), uid, exports.EXTENDS.USER_ROLES)
    exports.checkErr(r)
    return roles.concat(r.success.map((e) => e.name))
}

exports.getUserGroups = (app, req, db, uid) => {
    const r = app.api.efind(req, db, exports.getModelClass(db, exports.CLASSES.USER), uid, exports.EXTENDS.USER_GROUPS)
    exports.checkErr(r)
    return r.success
}

exports.getGroupRoles = (app, req, db, gid) => {
    const r = app.api.efind(req, db, exports.getModelClass(db, exports.CLASSES.USERGROUP), gid, exports.EXTENDS.GROUP_ROLES)
    exports.checkErr(r)
    return r.success.map((e) => e.name)
}

exports.isAdmin = (session) => {
    return util.intersection(session.roles, ['superadmin', 'dev_ops']).length > 0
}

exports.isInternal = (session) => {
    return session.roles.indexOf('internal') > -1
}

exports.wrapPushPacket = (child, data, type) => {
    return {
        'child': child,
        'type': type,
        'data': data
    }
}
exports.getNakedConn = (db)=>{
    return db.driver.db.conn
}