'use strict'

const debug = require('debug')

const logger = nameSpace => {
  const dInstance = debug(nameSpace)
  const debugEnabled = dInstance.enabled
  const debugPrint = (msg, level) => dInstance(`${level}: %O`, msg)

  return {
    info: msg =>
      debugEnabled ? debugPrint(msg, 'INFO') : console.log({ info: msg }),
    debug: msg =>
      debugEnabled ? debugPrint(msg, 'DEBUG') : console.debug({ info: msg }),
    warn: msg =>
      debugEnabled ? debugPrint(msg, 'WARN') : console.war({ info: msg }),
    error: msg =>
      debugEnabled ? debugPrint(msg, 'ERROR') : console.error(msg),
    fatal: msg =>
      debugEnabled ? debugPrint(msg, 'FATAL') : console.fatal({ info: msg })
  }
}

module.exports = logger
