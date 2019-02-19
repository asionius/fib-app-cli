const test = require('test')
test.setup()
const process = require('process')

const util = require('util')
const http = require('http')
const {
    CLASSES,
    EXTENDS,
    constants
} = require('../isomorphic')
const serverBase = `http://127.0.0.1:${process.env.APP_SERVER_PORT}`

describe('user & group & role', () => {
    describe('user', () => {
        let id, id1, id2, admin, user
        it('seed user signup', () => {
            const c = new http.Client()
            let r

            r = c.post(`${serverBase}/v1/${CLASSES.USER}/signup`, {
                json: {
                    username: 'normaluser',
                    password: '12345'
                }
            })
            assert.equal(r.json().message, '请联系管理员注册')

            r = c.post(`${serverBase}/v1/${CLASSES.USER}/signup`, {
                json: {
                    username: 'asion',
                    password: '12345',
                    phone: '15888888888',
                    gender: 'male',
                    email: 'asionius@163.com'
                }
            })
            id = r.json().id
            id2 = id
            assert.property(r.json(), 'id')
            assert.property(r.json(), 'createdAt')
        })
        it('admin login', () => {
            const c = new http.Client()
            const r = c.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'asion',
                    password: '12345'
                }
            })
            const json = r.json()
            assert.deepEqual(json, {
                "message": "ok",
                "data": {
                    "username": "asion",
                    "phone": "15888888888",
                    "realname": null,
                    "gender": "male",
                    "email": "asionius@163.com",
                    "id": id,
                    "groups": [],
                    "roles": [
                        "superadmin",
                        "dev_ops"
                    ]
                }
            })
            admin = c
        })
        it('sync user info', () => {
            const r = admin.post(`${serverBase}/v1/${CLASSES.USER}/sync`, {
                json: {}
            })
            assert.deepEqual(r.json(), {
                "message": "ok",
                "data": {
                    "username": "asion",
                    "phone": "15888888888",
                    "realname": null,
                    "gender": "male",
                    "email": "asionius@163.com",
                    "id": id,
                    "groups": [],
                    "roles": [
                        "superadmin",
                        "dev_ops"
                    ]
                }
            })
        })
        it('admin add user', () => {
            const c = new http.Client()
            c.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'asion',
                    password: '12345'
                }
            })
            let r = c.post(`${serverBase}/v1/${CLASSES.USER}`, {
                json: {
                    username: 'normaluser',
                    password: '12345'
                }
            })
            id = r.json().id
            id1 = id
            assert.property(r.json(), 'id')
            assert.property(r.json(), 'createdAt')
        })
        it('normal user login', () => {
            const c = new http.Client()
            const r = c.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'normaluser',
                    password: '12345'
                }
            })
            const json = r.json()
            assert.deepEqual(json, {
                "message": "ok",
                "data": {
                    "username": "normaluser",
                    "phone": null,
                    "realname": null,
                    "gender": null,
                    "email": null,
                    "id": id,
                    "groups": [],
                    "roles": [
                        "normal"
                    ]
                }
            })
            user = c
        })
        it('only admin can list user', () => {
            const c = new http.Client()
            const c1 = new http.Client()
            c.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'asion',
                    password: '12345'
                }
            })
            let r = c.get(`${serverBase}/v1/${CLASSES.USER}`)
            let list = r.json()
            assert.equal(list.length, 2)
            assert.equal(list[0].username, 'asion')
            assert.equal(list[1].username, 'normaluser')
            c1.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'normaluser',
                    password: '12345'
                }
            })
            r = c1.get(`${serverBase}/v1/${CLASSES.USER}`)
            assert.equal(r.json().code, 4030101)
        })
        it('admin query user', () => {
            const r = admin.get(`${serverBase}/v1/${CLASSES.USER}`, {
                query: {
                    where: `{
                        "or": [{
                            "username": "normaluser"
                        }, {
                            "username": "asion"
                        }]
                    }`,
                    skip: 1,
                    limit: 1,
                    count: 1
                }
            })
            assert.equal(r.json().results[0].username, 'normaluser')
            assert.equal(r.json().count, 2)
        })
        it('normal user get self', () => {
            const c = new http.Client()
            let r = c.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'normaluser',
                    password: '12345'
                }
            })
            id = r.json().data.id
            r = c.get(`${serverBase}/v1/${CLASSES.USER}/${id}`)
            const json = r.json()
            delete json.createdAt
            delete json.updatedAt
            assert.deepEqual(json, {
                "username": "normaluser",
                "phone": null,
                "realname": null,
                "gender": null,
                "email": null,
                "id": 2,
                "groups": [],
            })
        })
        it('edit user profiler', () => {
            const c = new http.Client()
            let r = c.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'normaluser',
                    password: '12345'
                }
            })
            const id = r.json().data.id
            r = c.put(`${serverBase}/v1/${CLASSES.USER}/${id}`, {
                json: {
                    phone: '13851111111'
                }
            })
            assert.equal(r.json().id, id)
            r = c.get(`${serverBase}/v1/${CLASSES.USER}/${id}`)
            assert.equal(r.json().phone, '13851111111')
        })
        it('only admin can delete user', () => {
            const c = new http.Client()
            const c1 = new http.Client()
            let id
            let r = c.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'normaluser',
                    password: '12345'
                }
            })
            r = c1.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'asion',
                    password: '12345'
                }
            })
            r = c1.post(`${serverBase}/v1/${CLASSES.USER}`, {
                json: {
                    username: 'testuser',
                    password: '12345'
                }
            })
            id = r.json().id
            r = c1.get(`${serverBase}/v1/${CLASSES.USER}`)
            assert.equal(r.json().length, 3)
            r = c.del(`${serverBase}/v1/${CLASSES.USER}/${id}`)
            assert.equal(r.json().code, 4030101)
            r = c1.del(`${serverBase}/v1/${CLASSES.USER}/${id}`)
            assert.equal(r.json().id, id)
            r = c1.get(`${serverBase}/v1/${CLASSES.USER}`)
            assert.equal(r.json().length, 2)
        })
        it('change password', () => {
            //normal user change password
            let r = user.post(`${serverBase}/v1/${CLASSES.USER}/chpass`, {
                json: {
                    [constants.FORM_USERID]: id1,
                    [constants.FORM_PASSWORD]: 'abcde'
                }
            })
            assert.equal(r.json().message, '提交的表格不完整: 缺少旧密码')
            r = user.post(`${serverBase}/v1/${CLASSES.USER}/chpass`, {
                json: {
                    [constants.FORM_USERID]: id1,
                    [constants.FORM_OLDPASSWORD]: '123456',
                    [constants.FORM_PASSWORD]: 'abcde'
                }
            })
            assert.equal(r.json().message, '旧密码不正确: 如忘记密码请联系管理员')
            r = user.post(`${serverBase}/v1/${CLASSES.USER}/chpass`, {
                json: {
                    [constants.FORM_USERID]: id1,
                    [constants.FORM_OLDPASSWORD]: '12345',
                    [constants.FORM_PASSWORD]: 'abcde'
                }
            })
            assert.equal(r.json().message, 'ok')
            //user login
            r = user.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'normaluser',
                    password: 'abcde'
                }
            })
            // console.log(r.json())
            assert.equal(r.json().data.id, id1)
            //admin user change password
            r = admin.post(`${serverBase}/v1/${CLASSES.USER}/chpass`, {
                json: {
                    [constants.FORM_USERID]: id1,
                    [constants.FORM_PASSWORD]: '12345'
                }
            })
            assert.equal(r.json().message, 'ok')
            //user login
            r = user.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'normaluser',
                    password: '12345'
                }
            })
            assert.equal(r.json().data.id, id1)
            //admin change self password
            r = admin.post(`${serverBase}/v1/${CLASSES.USER}/chpass`, {
                json: {
                    [constants.FORM_USERID]: id2,
                    [constants.FORM_PASSWORD]: 'xiangnide365day'
                }
            })
            assert.equal(r.json().message, 'ok')
            r = admin.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'asion',
                    password: 'xiangnide365day'
                }
            })
            assert.equal(r.json().data.id, id2)
            r = admin.post(`${serverBase}/v1/${CLASSES.USER}/chpass`, {
                json: {
                    [constants.FORM_USERID]: id2,
                    [constants.FORM_PASSWORD]: '12345'
                }
            })
        })
        it('admin appoints normal user to admin', ()=>{
            let r = admin.get(`${serverBase}/v1/${CLASSES.ROLE}`)
            let json = r.json()
            let rid
            json.forEach((r)=>{
                if (r.name === 'superadmin')
                    rid = r.id
            })
            admin.put(`${serverBase}/v1/${CLASSES.USER}/${id1}/${EXTENDS.USER_ROLES}`, {
                json: {
                    id: rid
                }
            })
            // user sync session
            user.post(`${serverBase}/v1/${CLASSES.USER}/sync`, {
                json: {}
            })
            // user has admin permission (list user and so on)
            r = user.get(`${serverBase}/v1/${CLASSES.USER}`)
            json = r.json()
            assert.equal(json.length, 2)
            // remove admin role
            r = admin.del(`${serverBase}/v1/${CLASSES.USER}/${id1}/${EXTENDS.USER_ROLES}/${rid}`)
            assert.property(r.json(), 'id')
        })
        it('logout', () => {
            let r = admin.post(`${serverBase}/v1/${CLASSES.USER}/logout`, {
                json: {}
            })
            assert.equal(r.json().message, 'ok')
            r = admin.post(`${serverBase}/v1/${CLASSES.USER}/sync`, {
                json: {}
            })
            assert.equal(r.json().message, 'need login')
            r = user.post(`${serverBase}/v1/${CLASSES.USER}/logout`, {
                json: {}
            })
            assert.equal(r.json().message, 'ok')
            r = user.post(`${serverBase}/v1/${CLASSES.USER}/sync`, {
                json: {}
            })
            assert.equal(r.json().message, 'need login')
        })
    })
    describe('group', () => {
        let id, c
        before(() => {
            c = new http.Client()
            c.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'asion',
                    password: '12345'
                }
            })
        })
        it('add usergroup', () => {
            const r = c.post(`${serverBase}/v1/${CLASSES.USERGROUP}`, {
                json: {
                    name: 'IT部门',
                    description: 'IT部'
                }
            })
            assert.property(r.json(), 'id')
        })
        it('list usergroup', () => {
            const r = c.get(`${serverBase}/v1/${CLASSES.USERGROUP}`)
            const json = r.json()
            assert.equal(json.length, 1)
            assert.equal(json[0].name, 'IT部门')
            assert.equal(json[0].description, 'IT部')
            id = json[0].id
        })
        it('edit usergroup', () => {
            let r = c.put(`${serverBase}/v1/${CLASSES.USERGROUP}/${id}`, {
                json: {
                    description: 'IT department'
                }
            })
            r = c.get(`${serverBase}/v1/${CLASSES.USERGROUP}/${id}`)
            const json = r.json()
            assert.equal(json.name, 'IT部门')
            assert.equal(json.description, 'IT department')
        })
        it('remove usergroup', () => {
            let r = c.del(`${serverBase}/v1/${CLASSES.USERGROUP}/${id}`)
            assert.equal(r.json().id, id)
            r = c.get(`${serverBase}/v1/${CLASSES.USERGROUP}`)
            const json = r.json()
            assert.equal(json.length, 0)
        })
    })
    describe('role', () => {
        let c, id
        before(() => {
            c = new http.Client()
            c.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'asion',
                    password: '12345'
                }
            })
        })
        it('get seed role', () => {
            const r = c.get(`${serverBase}/v1/role`)
            const json = r.json()
            assert.equal(json.length, 3)
            assert.equal(json[0].name, 'superadmin')
            assert.equal(json[1].name, 'dev_ops')
            assert.equal(json[2].name, 'normal')
        })
        it('add role', () => {
            const r = c.post(`${serverBase}/v1/role`, {
                json: {
                    name: 'grouper',
                    description: '组长'
                }
            })
            const json = r.json()
            assert.property(json, 'id')
            id = json.id
        })
        it('get role', () => {
            const r = c.get(`${serverBase}/v1/role`)
            const json = r.json()
            assert.equal(json.length, 4)
            assert.equal(json[3].id, id)
            assert.equal(json[3].name, 'grouper')
            assert.equal(json[3].description, '组长')
        })
        it('delete role', () => {
            let r = c.del(`${serverBase}/v1/${CLASSES.ROLE}/${id}`)
            let json = r.json()
            assert.equal(json.id, id)
            r = c.get(`${serverBase}/v1/role`)
            json = r.json()
            assert.equal(json.length, 3)
        })
    })
    describe('user & role', () => {
        let id, ids, c
        before(() => {
            c = new http.Client()
            let r = c.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'asion',
                    password: '12345'
                }
            })
            id = r.json().data.id
            r = c.post(`${serverBase}/v1/role`, {
                json: [{
                    name: 'role0',
                    description: 'role0 description'
                }, {
                    name: 'role1',
                    description: 'role1 description'
                }, {
                    name: 'role2',
                    description: 'role2 description'
                }]
            })
            ids = r.json().map((o) => o.id)
        })
        it('add role to user', () => {
            let r = c.put(`${serverBase}/v1/${CLASSES.USER}/${id}/${EXTENDS.USER_ROLES}`, {
                json: {
                    id: ids[0]
                }
            })
            assert.equal(r.json().id, id)
            r = c.get(`${serverBase}/v1/${CLASSES.ROLE}/${ids[0]}/${EXTENDS.ROLE_USERS}`)
            let json = r.json()
            assert.equal(json.length, 1)
            assert.equal(json[0].id, id)
            assert.equal(json[0].username, 'asion')
            r = c.get(`${serverBase}/v1/${CLASSES.USER}/${id}/${EXTENDS.USER_ROLES}`)
            json = r.json()
            assert.equal(json.length, 3)
            assert.equal(json[json.length - 1].id, ids[0])
            assert.equal(json[json.length - 1].name, 'role0')
        })
        it('delete user role', () => {
            c.del(`${serverBase}/v1/${CLASSES.USER}/${id}/${CLASSES.ROLE}/${ids[0]}`)
            const r = c.get(`${serverBase}/v1/${CLASSES.USER}/${id}/${EXTENDS.USER_ROLES}`)
            const json = r.json()
            assert.equal(json.length, 3)
            assert.notEqual(json[json.length - 1], ids[0])
        })
    })
    describe('group & user', () => {
        let id, id1, gid, id2, c
        before(() => {
            c = new http.Client()
            c.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'asion',
                    password: '12345'
                }
            })
            let r = c.post(`${serverBase}/v1/${CLASSES.USER}`, {
                json: [{
                    username: 'user01',
                    password: '12345'
                }, {
                    username: 'user02',
                    password: '12345'
                }, {
                    username: 'user03',
                    password: '12345'
                }]
            })
            const json = r.json()
            id = json[0].id
            id1 = json[1].id
            id2 = json[2].id
            r = c.post(`${serverBase}/v1/${CLASSES.USERGROUP}`, {
                json: {
                    name: 'IT部门',
                    description: 'IT部'
                }
            })
            gid = r.json().id
        })

        it('add user to group', () => {
            c.put(`${serverBase}/v1/${CLASSES.USERGROUP}/${gid}/${EXTENDS.GROUP_USERS}`, {
                json: {
                    id: id
                }
            })
            c.put(`${serverBase}/v1/${CLASSES.USERGROUP}/${gid}/${EXTENDS.GROUP_USERS}`, {
                json: {
                    id: id1
                }
            })
            let r = c.get(`${serverBase}/v1/${CLASSES.USERGROUP}/${gid}/${EXTENDS.GROUP_USERS}`)
            let json = r.json()
            assert.equal(json.length, 2)
            assert.equal(json[0].id, id)
            assert.equal(json[0].username, 'user01')
            assert.equal(json[1].id, id1)
            assert.equal(json[1].username, 'user02')
            r = c.get(`${serverBase}/v1/${CLASSES.USER}/${id}/${EXTENDS.USER_GROUPS}`)
            json = r.json()
            assert.equal(json.length, 1)
            assert.equal(json[0].id, gid)
            assert.equal(json[0].name, 'IT部门')
            assert.equal(json[0].description, 'IT部')
            r = c.get(`${serverBase}/v1/${CLASSES.USER}/${id1}/${EXTENDS.USER_GROUPS}`)
            json = r.json()
            assert.equal(json.length, 1)
            assert.equal(json[0].id, gid)
            assert.equal(json[0].name, 'IT部门')
            assert.equal(json[0].description, 'IT部')
        })
        it('del user from group', () => {
            c.del(`${serverBase}/v1/${CLASSES.USERGROUP}/${gid}/${EXTENDS.GROUP_USERS}/${id1}`)
            let r = c.get(`${serverBase}/v1/${CLASSES.USERGROUP}/${gid}/${EXTENDS.GROUP_USERS}`)
            const json = r.json()
            assert.equal(json.length, 1)
            assert.equal(json[0].id, id)
            assert.equal(json[0].username, 'user01')
        })
    })
    describe('group & role', () => {
        let id, id1, gid, id2, c
        before(() => {
            c = new http.Client()
            c.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
                json: {
                    username: 'asion',
                    password: '12345'
                }
            })
            let r = c.get(`${serverBase}/v1/role`)
            const json = r.json()
            id = json[3].id
            id1 = json[4].id
            id2 = json[5].id
            r = c.get(`${serverBase}/v1/${CLASSES.USERGROUP}`)
            gid = r.json()[0].id
        })

        it('add role to group', () => {
            c.put(`${serverBase}/v1/${CLASSES.USERGROUP}/${gid}/${EXTENDS.GROUP_ROLES}`, {
                json: {
                    id: id
                }
            })
            c.put(`${serverBase}/v1/${CLASSES.USERGROUP}/${gid}/${EXTENDS.GROUP_ROLES}`, {
                json: {
                    id: id1
                }
            })
            let r = c.get(`${serverBase}/v1/${CLASSES.USERGROUP}/${gid}/${EXTENDS.GROUP_ROLES}`)
            let json = r.json()
            assert.equal(json.length, 2)
            assert.equal(json[0].id, id)
            assert.equal(json[0].name, 'role0')
            assert.equal(json[1].id, id1)
            assert.equal(json[1].name, 'role1')
            r = c.get(`${serverBase}/v1/${CLASSES.ROLE}/${id}/${EXTENDS.ROLE_GROUPS}`)
            json = r.json()
            assert.equal(json.length, 1)
            assert.equal(json[0].id, gid)
            assert.equal(json[0].name, 'IT部门')
            assert.equal(json[0].description, 'IT部')
            r = c.get(`${serverBase}/v1/${CLASSES.ROLE}/${id1}/${EXTENDS.ROLE_GROUPS}`)
            json = r.json()
            assert.equal(json.length, 1)
            assert.equal(json[0].id, gid)
            assert.equal(json[0].name, 'IT部门')
            assert.equal(json[0].description, 'IT部')
        })
        it('del role from group', () => {
            c.del(`${serverBase}/v1/${CLASSES.USERGROUP}/${gid}/${EXTENDS.GROUP_ROLES}/${id1}`)
            let r = c.get(`${serverBase}/v1/${CLASSES.USERGROUP}/${gid}/${EXTENDS.GROUP_ROLES}`)
            const json = r.json()
            assert.equal(json.length, 1)
            assert.equal(json[0].id, id)
            assert.equal(json[0].name, 'role0')
        })
    })
})