'use strict'

const args = require('args')

class Config {
  static get gotoOptions() {
    const flags = args.parse(process.argv)
    return {
      timeout: flags.timeoutpage,
      waitUntil: 'networkidle2'
    }
  }

  static get waitForOptions() {
    const flags = args.parse(process.argv)
    return {
      timeout: flags.timeoutobject
    }
  }

  static get waitForOptionsImmediately() {
    return {
      timeout: 1000
    }
  }
}
module.exports = { Config }
