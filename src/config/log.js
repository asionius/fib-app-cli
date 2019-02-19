const { log_path } = require('./vars')
const log_config = [
    {
        type: "console",
        levels: [console.INFO, console.ERROR]
    },
    {
        type: "file",
        levels: [console.INFO, console.ERROR],
        path: log_path,
        split: "day",
        count: 10
    }
]
module.exports = log_config