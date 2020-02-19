'use strict'

const chalk = require('chalk')
const { createLogger, format, transports } = require('winston')

const { timestamp, json, combine } = format
const { Config } = require('../config')

const config = new Config()

class Logger {
  constructor(nameSpace, depth = 0, rgb = [255, 255, 255]) {
    this._nameSpace = nameSpace
    this._pathNameSpaceLog = `${config.get('log_location')}/${nameSpace}.log`
    this._pathFullLog = `${config.get('log_location')}/full.log`
    this._debugAsDeveloper = config.get('debug_mode') === 'developer'
    this._depth = this._debugAsDeveloper ? '    '.repeat(depth) : ''
    this._colorize = this._debugAsDeveloper ? chalk.rgb(...rgb) : x => x

    const formatInfo = ({ level, ...infoTmp }) => {
      const info = {
        level,
        nameSpace: this._colorize(this._nameSpace),
        ...infoTmp
      }
      const toString = value =>
        typeof value === 'string' || value instanceof String
          ? `"${value}"`
          : JSON.stringify(value)

      return `${this._depth}{${Object.keys(info)
        .map(key => `"${key}": ${this._colorize(toString(info[key]))}`)
        .join(', ')}}`
    }

    this._logger = createLogger({
      transports: [
        new transports.Console({
          format: combine(format.printf(formatInfo))
        }),
        new transports.File({
          filename: this._pathNameSpaceLog,
          format: combine(timestamp(), json())
        }),
        new transports.File({
          filename: this._pathFullLog,
          format: combine(timestamp(), json())
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
}

module.exports = { Logger }
