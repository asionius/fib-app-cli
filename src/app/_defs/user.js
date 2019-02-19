const util = require('util')
const crypto = require('crypto')
const hash = require('hash')
const AppPlugins = require('appPlugins')
const _utils = require('./_utils')
const {
    CLASSES,
    EXTENDS,
    constants
} = _utils
const {
    errorcode,
    formchecker
} = require('../../utils');

const seeds = require('../seed')

function getRemoteInfo(req) {
    return {
        ip: req.socket.remoteAddress,
        port: req.socket.remotePort,
        userAgent: req.firstHeader('User-Agent')
    }
}

function encryptPasswordWithSalt(password, salt) {
    return crypto.pbkdf2(password, salt, 256, 64, 'sha1').hex();
}

function buildSession(u, req) {
    const infos = getRemoteInfo(req)
    const form = {
        os: null,
        device_sid: null,
        ua: infos.userAgent,
        ip: infos.ip,
        user_id: u.id,
        online: false,
    }
    const md5Value = hash.md5(
        new Buffer(JSON.stringify(form))
    ).digest().hex()
    form.hash = md5Value

    return form
}

module.exports = (db) => {
    const User = db.define(CLASSES.USER, {
        username: {
            type: 'text',
            unique: true
        },
        phone: {
            type: 'text',
            unique: true
        },
        realname: String,
        gender: constants.GENDERS,
        email: String,
        password: String,
        salt: String
    }, {
        ACL: function (session) {
            return {
                '*': {
                    'sync': true,
                    'signup': true,
                    'login': true,
                    '*': false
                },
                roles: {
                    'normal': {
                        'chpass': true,
                        'logout': true
                    },
                    ..._utils.aclAllowInternalRole(),
                    ..._utils.aclAllowRole('superadmin'),
                    ..._utils.aclAllowRole('dev_ops')
                }
            }
        },
        OACL: function (session) {
            const _acl = {};

            if (this.id === session.id) {
                const properties = Object.keys(_utils.getClassProperties(db, CLASSES.USER))
                const exts = Object.keys(_utils.getClassExtends(db, CLASSES.USER))
                _acl[session.id] = {
                    '*': util.union(util.without(properties, 'password', 'salt'), exts),
                    'extends': {
                        '*': true
                    }
                };
            }
            return _acl;

        },
        hooks: {
            beforeCreate: function () {
                var salt = crypto.pseudoRandomBytes(64);
                this.salt = salt.hex();
                this.password = encryptPasswordWithSalt(this.password, this.salt)
            },
            afterCreate: function () {
                const pThis = this

                function initUserRole(role, disp, desc) {
                    req.query = {
                        where: {
                            'name': role
                        }
                    }
                    let roles = app.api.find(req, db, _utils.getModelClass(db, CLASSES.ROLE))
                    _utils.checkErr(roles)
                    let roleObj = roles.success[0]
                    if (!roleObj) {
                        let r = app.api.epost(req, db, _utils.getModelClass(db, CLASSES.USER), pThis.id, EXTENDS.USER_ROLES, {
                            name: role,
                            displayName: disp,
                            description: desc
                        })
                        _utils.checkErr(r)
                    } else {
                        let r = app.api.elink(req, db, _utils.getModelClass(db, CLASSES.USER), pThis.id, EXTENDS.USER_ROLES, roleObj)
                        _utils.checkErr(r)
                    }
                    isNormal = false
                }
                const userRoles = seeds.userRoles
                let isNormal = true
                let app = AppPlugins.AppStore.getApp()
                let req = _utils.getInternalReq({
                    id: this.id
                })
                if (userRoles.superadmin.includes(this.username))
                    initUserRole('superadmin', '超级管理员', '超级管理员, 具有除了运维或初始化网站信息之外的所有权限')
                if (userRoles.dev_ops.includes(this.username))
                    initUserRole('dev_ops', '开发者', '开发者, 具有包括运维或初始化网站信息在内的所有权限')
                if (isNormal)
                    initUserRole('normal', '普通用户', '普通用户, 仅可查看自己信息和部分信息')
            }
        },
        functions: {
            signup: (req, data) => {
                const _req = _utils.getInternalReq({})
                const app = AppPlugins.AppStore.getApp()
                const userRoles = seeds.userRoles
                const {
                    username
                } = data

                if (!username)
                    return errorcode.fillError('提交的表格不完整')
                if (!userRoles.superadmin.includes(username) && !userRoles.dev_ops.includes(username))
                    return errorcode.fillError('请联系管理员注册')

                const ckrs = formchecker(data, (err, msg, ext) => err ? errorcode.fillError(msg, ext) : null)
                if (ckrs) return ckrs

                return app.api.post(_req, db, _utils.getModelClass(db, CLASSES.USER), data)
            },
            sync: (req, data) => {
                const session = req.session
                const sid = session.sessionid
                if (!('online' in session) || session.online) {
                    const app = AppPlugins.AppStore.getApp()
                    let _req = req,
                        u
                    if (!session.online) {
                        const s = UserSession.findSync({
                            sessionid: sid
                        })
                        if (s.length === 0 || !s[0].online)
                            return errorcode.fillOk('need login')

                        session.online = true
                        const uid = s[0].user_id
                        _req = _utils.getInternalReq({})
                        _req.query = {
                            where: {
                                id: uid
                            }
                        }
                        u = app.api.find(_req, db, _utils.getModelClass(db, CLASSES.USER))
                        _utils.checkErr(u)
                        u = u.success[0]
                    } else {
                        u = app.api.get(_req, db, _utils.getModelClass(db, CLASSES.USER), session.id)
                        _utils.checkErr(u)
                        u = u.success
                    }
                    return fillSession(_req, db, app, session, u)
                } else
                    return errorcode.fillOk('need login')
            },
            chpass: (req, data) => {
                function _chpass(checkOld) {
                    if (checkOld)
                        if (!oldPass)
                            return errorcode.fillError('提交的表格不完整', '缺少旧密码')

                    const _req = _utils.getInternalReq({})
                    _req.query = {
                        where: {
                            id: uid
                        }
                    }
                    let u = app.api.find(_req, db, _utils.getModelClass(db, CLASSES.USER))
                    _utils.checkErr(u)
                    u = u.success[0]
                    if ((checkOld))
                        if (u.password !== encryptPasswordWithSalt(oldPass, u.salt))
                            return errorcode.fillError('旧密码不正确', '如忘记密码请联系管理员')
                    u.password = encryptPasswordWithSalt(password, u.salt)
                    let r = app.api.put(_req, db, _utils.getModelClass(db, CLASSES.USER), uid, u)
                    _utils.checkErr(r)
                    return errorcode.fillOk()
                }

                const session = req.session
                if (session.online !== true)
                    return errorcode.fillError('用户尚未登录, 请先登录')

                const {
                    [constants.FORM_USERID]: uid,
                    [constants.FORM_OLDPASSWORD]: oldPass,
                    [constants.FORM_PASSWORD]: password
                } = data

                if (!password)
                    return errorcode.fillError('提交的表格不完整', '新密码不能为空')

                const app = AppPlugins.AppStore.getApp()

                // normal user
                if (session.id == Number(uid) && !_utils.isAdmin(session)) {
                    return _chpass(1)
                    // admin user
                } else if (_utils.isAdmin(session)) {
                    return _chpass()
                } else
                    return errorcode.fillError('没有访问权限')
            },
            login: (req, data) => {
                const {
                    username,
                    password
                } = data || {}
                if (!username || !password)
                    return errorcode.fillError('缺少用户名或密码')
                const app = AppPlugins.AppStore.getApp()
                const _req = _utils.getInternalReq({})
                _req.query = {
                    where: {
                        'username': username
                    }
                }
                let r = app.api.find(_req, db, _utils.getModelClass(db, CLASSES.USER))
                _utils.checkErr(r)
                const u = r.success[0]
                if (!u)
                    return errorcode.fillError('用户名不存在')

                if (encryptPasswordWithSalt(password, u.salt) !== u.password)
                    return errorcode.fillError('密码不正确')

                // save to session table
                const form = buildSession(u, req.request)
                _req.session.id = form.user_id
                _req.query = {
                    where: {
                        user_id: form.user_id
                    }
                }
                r = app.api.find(_req, db, _utils.getModelClass(db, CLASSES.USER_USERSESSION))
                _utils.checkErr(r)
                const sessionItem = r.success[0]
                if (!sessionItem) {
                    form.online = true
                    form.sessionid = req.session.sessionid
                    // not suggest use orm native functions
                    UserSession.createSync(form)
                    // u.setUsersessionSync(form)
                } else {
                    sessionItem.online = true
                    sessionItem.sessionid = req.session.sessionid
                    // native functions
                    sessionItem.saveSync()
                }
                // init user session
                return fillSession(_req, db, app, req.session, u)
            },
            logout: (req, data) => {
                const app = AppPlugins.AppStore.getApp()
                req.query = {
                    where: {
                        sessionid: req.session.sessionid
                    }
                }
                // let r = app.api.find(req, db, _utils.getModelClass(db, CLASSES.USER_USERSESSION))
                let r = UserSession.findSync({
                    sessionid: req.session.sessionid
                })
                if (r.length === 0)
                    return errorcode.fillError('内部错误')
                const s = r[0]
                s.online = false
                s.saveSync()
                // r = app.api.put(req, db, _utils.getModelClass(db, CLASSES.USER_USERSESSION), s)
                clearSession(req)
                return errorcode.fillOk()
            }
        }
    });

    const UserSession = User.extendsTo(CLASSES.USERSESSION, {
        os: String,
        ua: String,
        ip: String,
        device_sid: String,
        sessionid: String,
        online: Boolean,
        hash: String
    }, {
        ACL: {
            '*': false,
            'roles': {
                ..._utils.aclAllowInternalRole(),
                ..._utils.aclAllowRole('superadmin'),
                ..._utils.aclAllowRole('dev_ops')
            }
        }
    })

    const Group = db.define(CLASSES.USERGROUP, {
        name: {
            type: 'text',
            unique: true
        },
        description: String
    })

    const Role = db.define(CLASSES.ROLE, {
        name: {
            type: 'text',
            unique: true
        },
        displayName: {
            type: 'text',
            unique: true
        },
        description: String,
    }, {
        ACL: function (session) {
            return {
                '*': {
                    '*': false
                },
                roles: {
                    ..._utils.aclAllowInternalRole(),
                    ..._utils.aclAllowRole('superadmin'),
                    ..._utils.aclAllowRole('dev_ops')
                }
            }
        }
    })
    User.hasMany(EXTENDS.USER_GROUPS, Group, {}, {
        reverse: EXTENDS.GROUP_USERS,
        key: true,
        autoFetch: true
    })
    User.hasMany(EXTENDS.USER_ROLES, Role, {}, {
        reverse: EXTENDS.ROLE_USERS,
        key: true
    })
    Group.hasMany(EXTENDS.GROUP_ROLES, Role, {}, {
        reverse: EXTENDS.ROLE_GROUPS,
        key: true,
        autoFetch: true
    })

    function fillSession(req, db, app, session, u) {
        req.query = {}
        const info = util.omit(u, 'password', 'salt', 'createdAt', 'updatedAt', 'roles')
        util.extend(session, info)
        session.roles = getUserSessionRoles(app, req, db, u.id)
        session.online = true
        return errorcode.fillData(util.omit(session, 'online'))
    }

    function clearSession(req) {
        req.session.id = null
        req.session.online = false
        req.session.roles = []
        const sessionService = AppPlugins.sessionService.getSessionService()
        sessionService.remove(req.session.sessionid)
    }

    function getUserSessionRoles(app, req, db, uid) {
        let roles = []
        let rs = _utils.getUserRoles(app, req, db, uid)
        let groups = _utils.getUserGroups(app, req, db, uid)
        groups.forEach((g) => {
            let r = _utils.getGroupRoles(app, req, db, g.id)
            roles = roles.concat(r)
        })
        return util.unique(rs.concat(roles))
    }
};