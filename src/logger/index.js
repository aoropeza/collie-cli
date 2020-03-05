'use strict'

const { v4: uuidv4 } = require('uuid')
const chalk = require('chalk')
const { createLogger, format, transports } = require('winston')

const { combine } = format
const { Config } = require('../config')

const config = new Config()

class Logger {
  constructor(nameSpace, depth = 0, rgb = [255, 255, 255]) {
    this._nameSpace = nameSpace
    this._pathLog = `${config.get('variables.log_location')}/log-${
      Logger.uuid
    }.log`

    this._debugAsDeveloper = config.get('variables.debug_mode') === 'developer'
    this._depth = this._debugAsDeveloper ? '    '.repeat(depth) : ''
    this._colorize = this._debugAsDeveloper ? chalk.rgb(...rgb) : x => x

    const formatInfo = colors => ({ level, ...infoTmp }) => {
      const info = {
        level,
        nameSpace: this._nameSpace,
        ...infoTmp
      }
      const toString = value =>
        typeof value === 'string' || value instanceof String
          ? `"${value}"`
          : JSON.stringify(value)

      return `${this._depth}{${Object.keys(info)
        .map(
          key =>
            `"${key}": ${
              colors ? this._colorize(toString(info[key])) : toString(info[key])
            }`
        )
        .join(', ')}}`
    }

    this._logger = createLogger({
      transports: [
        new transports.Console({
          format: combine(format.printf(formatInfo(true)))
        }),
        new transports.File({
          filename: this._pathLog,
          format: combine(format.printf(formatInfo(false)))
        })
      ]
    })
  }

  error(message) {
    this._logger.log({
      level: 'error',
      message
    })
  }

  warn(message) {
    this._logger.log({
      level: 'warn',
      message
    })
  }

  info(message) {
    this._logger.log({
      level: 'info',
      message
    })
  }

  get path() {
    return this._pathLog
  }
}
Logger.uuid = uuidv4()

module.exports = { Logger }
