const fs = require('fs')
const path = require('path')
module.exports = (v)=>{
    if(v.response.statusCode == 404)
    {
        const f = fs.openFile(path.join(__dirname, '../static/index.html'))
        v.response.statusCode = 200
        v.response.setHeader('Content-Type', 'text/html')
        f.copyTo(v.response.body)
    }
}