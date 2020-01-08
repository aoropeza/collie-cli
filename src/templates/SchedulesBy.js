/* eslint-disable class-methods-use-this */

'use strict'

const logger = require('../logger')('collie:cli:Template:SchedulesBy')

class SchedulesBy {
  constructor(page, filter) {
    this._page = page
    this._filter = filter
    this._schedules = []
  }

  async startScrapper() {
    logger.info('[Method] startScrapper')
    throw new Error('Please implement this in inheritors')
  }

  get schedules() {
    return this._schedules
  }

  get filter() {
    return this._filter
  }
}
module.exports = { SchedulesBy }
