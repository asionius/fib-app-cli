const _utils = require('./_utils')
const {
    CLASSES
} = _utils

module.exports = (db) => {
    const AttachInfo = db.define(CLASSES.ATTACHINFO, {
        hash: {
            type: 'text',
            size: 32,
            required: true,
            unique: true
        },
        name: String,
        size: Number,
        type: String,
        width: Number,
        height: Number,
        isdeleted: {
            type: 'boolean',
            defaultValue: false
        }
    }, {})

    const Attachment = AttachInfo.extendsTo(CLASSES.ATTACHMENT, {
        hash: {
            type: 'text',
            size: 32,
        },
        v: {
            type: 'binary',
            big: true
        }
    }, {})
}