const net = require('net')
const url = require('url')
const fs = require('fs')
const util = require("util")

function smtp(config) {
    const {
        username: name,
        password: pwd,
        hostname,
        port
    } = config
    const to = (config.to || "").split(",")

    if (!name || !pwd || !hostname || !port || !to.length)
        throw new Error("smtp params is error")

    this.send = function (d) {
        const {
            title,
            content,
            attachment
        } = d

        if (!title || !content || (attachment && !util.isArray(attachment)))
            throw new Error("smtp send:params is error")

        let _smtp = new net.Smtp()
        _smtp.connect(url.format({
            protocol: 'tcp:',
            slashes: true,
            hostname: hostname,
            port: port
        }))
        _smtp.hello()
        _smtp.login(name, pwd)
        _smtp.from(`<${name}>`)


        let MIME = ""
        // -------MIME---------
        MIME += "from:" + name + "\r\n"

        MIME += "to:" + to.join(",") + "\r\n"

        MIME += "subject:" + title + "\r\n"

        MIME += "MIME-Version:1.0\r\n"

        MIME += "Content-Type:multipart/mixed;boundary=#hualidefengexian#\r\n"

        // -------CONTENT---------
        MIME += "\r\n--#hualidefengexian#\r\n"

        MIME += "Content-Type:text/plain;charset=utf-8\r\n"

        MIME += "Content-Transfer-Encoding:7bit\r\n"

        MIME += "\r\n" + content

        // -------ATTACHMENT---------
        if (attachment) {
            let attachment_type = d.attachment_type || ""
            //attachment在内存中
            if (attachment_type === 'buffer') {
                attachment.forEach(function (acmt) {
                    let filename = acmt.name

                    MIME += "\r\n--#hualidefengexian#\r\n"

                    MIME += "Content-Type:application/octet-stream;name=" + filename + "\r\n"

                    MIME += "Content-Transfer-Encoding:base64\r\n\r\n"

                    MIME += new Buffer(acmt.attachment).base64()
                })
            } else {
                let files = []
                attachment.forEach(function (acmt) {
                    let filename = acmt.name,
                        filepath = acmt.path

                    if (files.indexOf(filepath) !== -1) return

                    files.push(filepath)

                    if (!filename || !fs.exists(filepath))
                        throw new Error("smtp attachment is error!")

                    let f = fs.open(filepath)

                    MIME += "\r\n--#hualidefengexian#\r\n"

                    MIME += "Content-Type:application/octet-stream;name=" + filename + "\r\n"

                    MIME += "Content-Transfer-Encoding:base64\r\n\r\n"

                    MIME += f.readAll().base64()
                    f.dispose()
                })
            }
        }

        MIME += "\r\n--#hualidefengexian#--\r\n"

        to.forEach(function (receiver) {
            _smtp.to(receiver)
        })
        _smtp.data(MIME)
        _smtp.quit()
    }
}

module.exports = (to, config) => {
    return new smtp({
        username: config.username,
        password: config.password,
        hostname: config.hostname,
        port: config.port,
        to: to
    })
}