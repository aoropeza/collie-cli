'use strict'

const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const readFile = promisify(fs.readFile)

const chalk = require('chalk')
const { createLogger, format, transports } = require('winston')

const { combine } = format
const { Config } = require('../config')

const config = new Config()

class Logger {
  constructor(nameSpace, depth = 0, rgb = [255, 255, 255]) {
    this._nameSpace = nameSpace
    this._pathLog = `${config.get('log_location')}/log.log`

    this._debugAsDeveloper = config.get('debug_mode') === 'developer'
    this._depth = this._debugAsDeveloper ? '    '.repeat(depth) : ''
    this._colorize = this._debugAsDeveloper ? chalk.rgb(...rgb) : x => x

    const formatInfo = colors => ({ level, ...infoTmp }) => {
      const info = {
        level,
        nameSpace: colors ? this._colorize(this._nameSpace) : this._nameSpace,
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
          format: combine(format.printf(formatInfo(true)))
        }),
        new transports.File({
          filename: path.join(__dirname, '/', this._pathLog),
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

  async fullLog() {
    return readFile(path.resolve(__dirname, this._pathLog), 'utf-8')
  }
}

module.exports = { Logger }
