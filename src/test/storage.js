const test = require('test')
test.setup()
const process = require('process')
const gd = require('gd')
const hash = require('hash')
const io = require('io')
const http = require('http')
const {
    CLASSES,
} = require('../isomorphic')
const serverBase = `http://127.0.0.1:${process.env.APP_SERVER_PORT}`

function readimg(data) {
    var s = new io.MemoryStream();
    s.write(new Buffer('--7d33a816d302b6\r\nContent-Disposition: form-data;name="file";filename=file.name\r\n\r\n'));
    s.write(data);
    s.write(new Buffer("\r\n--7d33a816d302b6\r\n"));
    s.rewind();
    return s.read();
}

describe('storage', () => {
    let user, hs, path
    before(() => {
        const c = new http.Client()
        c.post(`${serverBase}/v1/${CLASSES.USER}/login`, {
            json: {
                username: 'normaluser',
                password: '12345'
            }
        })
        user = c
    })
    it('upload image', () => {
        let img = gd.create(200, 200)
        img.line(10, 10, 200, 200, img.colorAllocate(100, 200, 255));
        img.line(0, 200, 200, 0, img.colorAllocate(70, 90, 255));
        img.line(100, 0, 200, 100, img.colorAllocate(50, 120, 255));
        img.line(100, 20, 200, 80, img.colorAllocate(50, 220, 255));
        hs = hash.md5(img.getData(gd.JPEG, 100)).digest('hex').toString()
        let r = user.post(`${serverBase}/storage/upload`, {
            headers: {
                "Content-type": "multipart/form-data;boundary=7d33a816d302b6"
            },
            body: readimg(img.getData(gd.JPEG, 100))
        })
        let json = r.json()
        path = json.data.path
        //the image path here would be starts with root path 'f' following host address
        assert.isTrue(path.endsWith('/f/' + hs))
    })
    it(('download image'), () => {
        let r = user.get(`${serverBase}${path}`)
        assert.equal(hash.md5(r.data).digest('hex').toString(), hs)
    })
})