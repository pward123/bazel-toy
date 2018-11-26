'use strict'

const TRACE = 0
const DEBUG = 1
const INFO = 2
const WARN = 3
const ERROR = 4
const FATAL = 5

const LOG_LEVEL = (() => {
    switch (process.env.LOG_LEVEL) {
        case 'trace':
            return TRACE
        case 'debug':
            return DEBUG
        case 'info':
            return INFO
        case 'warn':
            return WARN
        case 'error':
            return ERROR
        case 'fatal':
            return FATAL
        default:
            const intLevel = parseInt(process.env.LOG_LEVEL)
            return isNaN(intLevel) ? ERROR : intLevel
    }
})()

const log = (logLevel, ...rest) => {
    if (logLevel >= LOG_LEVEL) {
        if (logLevel >= ERROR) {
            console.error(...rest)
        } else if (logLevel >= WARN) {
            console.warn(...rest)
        } else {
            console.log(...rest)
        }
    }
}

module.exports = {
    trace: log.bind(null, TRACE),
    debug: log.bind(null, DEBUG),
    info: log.bind(null, INFO),
    warn: log.bind(null, WARN),
    error: log.bind(null, ERROR),
    fatal: log.bind(null, ERROR),
}
