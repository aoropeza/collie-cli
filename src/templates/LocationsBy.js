/* eslint-disable class-methods-use-this */

'use strict'

const { Logger } = require('../logger')

const logger = new Logger('collie:cli:Template:LocationsBy', 4, [153, 153, 153])

class LocationsBy {
  constructor(page, filter) {
    this._page = page
    this._filter = filter
    this._locations = []
  }

  async startScrapper() {
    logger.info('startScrapper()')
    await this.scrapeLocations()
  }

  async scrapeLocations() {
    logger.info('scrapeLocations()')
    throw new Error('Please implement this in inheritors')
  }

  async unSelectLocations() {
    logger.info('unSelectLocations()')
    throw new Error('Please implement this in inheritors')
  }

  get locations() {
    return this._locations
  }

  get filter() {
    return this._filter
  }
}
module.exports = { LocationsBy }
