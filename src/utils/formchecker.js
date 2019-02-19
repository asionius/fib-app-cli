const util = require('util')
const re = require('./re')

module.exports = function(form, cb) {
    const errormsg = `提交内容格式有误`
    if(!util.isObject(form))
        return cb(true, errormsg, `${form} is not an object`)
    let phone
    if(('phone' in form && (phone = form['phone'])) || ('telephone' in form && (phone = form['telephone'])))
    {
        if (!new RegExp(re.rePhone).test(phone))
            return cb(true, errormsg, `phone: ${phone}`)
    }
    let mail
    if (('mail' in form && (mail = form['mail'])) || ('email' in form && (mail = form['email']))) {
        if (!new RegExp(re.reMail).test(mail))
            return cb(true, errormsg, `mail: ${mail}`)
    }
    if('ip' in form)
    {
        if(!new RegExp(re.reIp).test(form.ip))
            return cb(true, errormsg, `ip: ${form.ip}`)
    }
    return cb(false)
}