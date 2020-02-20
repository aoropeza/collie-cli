/* eslint-disable class-methods-use-this */

'use strict'

const { Logger } = require('../logger')

const logger = new Logger('collie:cli:Template:SchedulesBy', 0, [153, 153, 153])

class SchedulesBy {
  constructor(page, filter) {
    this._page = page
    this._filter = filter
    this._schedules = []
  }

  async startScrapper() {
    logger.info('startScrapper()')
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
