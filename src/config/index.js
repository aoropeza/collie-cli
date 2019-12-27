'use strict'

class Config {
  static get gotoOptions() {
    return {
      timeout: 60000,
      waitUntil: 'networkidle2'
    }
  }

  static get waitForOptions() {
    return {
      timeout: 60
    }
  }
}
module.exports = { Config }
