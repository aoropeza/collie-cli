/* eslint-disable class-methods-use-this */

'use strict'

const logger = require('../logger')('collie:cli:Template:LocationsBy')

class LocationsBy {
  constructor(page, filter) {
    this._page = page
    this._filter = filter
    this._locations = []
  }

  async startScrapper() {
    logger.info('[Method] startScrapper')
    await this.scrapeLocations()
    await this.unSelectLocations()
  }

  async scrapeLocations() {
    logger.info('[Method] scrapeLocations')
    throw new Error('Please implement this in inheritors')
  }

  async unSelectLocations() {
    logger.info('[Method] unSelectLocations')
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
