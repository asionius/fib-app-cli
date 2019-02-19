const test = require('test')
test.setup()
const process = require('process')

const http = require('http')
const {
    CLASSES,
} = require('../isomorphic')

const serverBase = `http://127.0.0.1:${process.env.APP_SERVER_PORT}`

describe('tableManage', () => {
    let c
    before(() => {
        c = new http.Client()
        c.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
            json: {
                username: 'asion',
                password: '12345'
            }
        })
    })
    it('getTable', () => {
        const rs = c.post(`${serverBase}/v1/${CLASSES.TABLE_MANAGE}/getTables`, {
            json: {}
        })
        const json = rs.json()
        assert.greaterThan(json.length, 0)
        json.forEach((j) => {
            assert.property(j, 'name')
            assert.property(j, 'description')
            assert.isFalse(j['hasinit'])
        })
    })
    // it('initTableRole', () => {
    //     let rs = c.post(`${serverBase}/v1/${CLASSES.TABLE_MANAGE}/initTableRole`, {
    //         json: {
    //             tableName: CLASSES.DOMRC_BLACKLIST
    //         }
    //     })
    //     rs = c.post(`${serverBase}/v1/${CLASSES.TABLE_MANAGE}/getTables`, {
    //         json: {}
    //     })
    //     rs.json().forEach((r) => {
    //         if (r.name === CLASSES.DOMRC_BLACKLIST)
    //             assert.isTrue(r.hasinit)
    //     })
    // })
})