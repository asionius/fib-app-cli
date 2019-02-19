const mq = require('mq')
const io = require('io')
const http = require('http')
const net = require('net')

const Handler = new mq.Routing()

function getResponse(response) {
    let contentType = response.firstHeader('Content-Type')
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
        let content
        try {
            content = response.data.toString('gbk')
        } catch (e) {
            content = response.data.toString('utf-8')
        }
        return content
    } else if (contentType.includes('application/json')) {
        return response.json()
    }
}
Handler.post('/', function (v) {
    var querys;
    try {
        querys = v.json().requests;
    } catch (e) {}
    const results = querys.map(q => {
        const r = new http.Request()
        r.method = q.method
        if (typeof q.headers === 'object' && Object.keys(q.headers).length) {
            r.setHeader(q.headers)
        }
        const a = q.path.split('?')
        r.address = r.value = a[0]
        if (a[1]) r.queryString = a[1]
        r.session = v.session
        if (q.body) {
            r.json(q.body);
        }
        const _proxyHost = q.proxy.replace('http://', 'tcp://')

        const _s = net.connect(_proxyHost)
        r.sendTo(_s)
        const _bs = new io.BufferedStream(_s);
        _bs.EOL = "\r\n";
        r.response.readFrom(_bs)
        const p = r.response
        if (Math.floor(p.statusCode / 100) !== 2) {
            return {
                'error': getResponse(p)
            };
        } else {
            return {
                'success': getResponse(p)
            };
        }
    });
    v.response.json(results)
})
module.exports = Handler