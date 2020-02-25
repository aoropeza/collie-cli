'use strict'

const fs = require('fs')
const path = require('path')

const convict = require('convict')

const schema = require('./schema')

class Config {
  constructor() {
    this._config = convict(schema)
    this._load = file => {
      const fullPath = path.resolve(__dirname, file)
      return fs.existsSync(fullPath)
        ? this._config.loadFile(fullPath)
        : undefined
    }

    const env = this._config.get('variables.env')

    this._load(`${env}.json`)
    this._load('local.json')
    this._config.validate({ allowed: 'strict' })
  }

  get(key) {
    return this._config.get(key)
  }
}
module.exports = { Config }
