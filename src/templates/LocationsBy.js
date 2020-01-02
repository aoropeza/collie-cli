/* eslint-disable class-methods-use-this */

'use strict'

class LocationsBy {
  constructor(page, filter) {
    this._page = page
    this._filter = filter
    this._locations = []
  }

  async startScrapper() {
    await this.scrapeLocations()
    await this.unSelectLocation()
  }

  async scrapeLocations() {
    throw new Error('Please implement this in inheritors')
  }

  async unSelectLocation() {
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
