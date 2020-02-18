'use strict'

const chalk = require('chalk')
const { createLogger, format, transports } = require('winston')

const { timestamp, prettyPrint, combine } = format

class Logger {
  constructor(nameSpace) {
    this._nameSpace = nameSpace
    this._pathLog = `./logs/${nameSpace}.log`

    const formatInfo = ({ level, ...infoTmp }) => {
      const info = {
        level,
        route: this._nameSpace,
        ...infoTmp
      }
      const toString = value =>
        typeof value === 'string' || value instanceof String
          ? `"${value}"`
          : JSON.stringify(value)

      return `{${Object.keys(info)
        .map(key => `"${key}": ${toString(info[key])}`)
        .join(', ')}}`
    }

    this._logger = createLogger({
      transports: [
        new transports.Console({
          format: combine(format.printf(formatInfo))
        }),
        new transports.File({
          filename: this._pathLog,
          format: combine(timestamp(), prettyPrint())
        })
      ]
    })
  }

  info(message) {
    this._logger.log({
      level: 'info',
      route: chalk.cyan(this._nameSpace),
      message
    })
  }
}
module.exports = Logger
