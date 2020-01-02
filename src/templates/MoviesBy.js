/* eslint-disable class-methods-use-this */

'use strict'

class MoviesBy {
  constructor(page, filter) {
    this._page = page
    this._filter = filter
    this._movies = []
  }

  async startScrapper() {
    throw new Error('Please implement this in inheritors')
  }

  get movies() {
    return this._movies
  }
}
module.exports = { MoviesBy }
