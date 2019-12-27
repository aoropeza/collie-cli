/* eslint-disable class-methods-use-this */

'use strict'

class Movie {
  constructor(page) {
    this._page = page
  }

  // eslint-disable-next-line no-unused-vars
  async startScrapeMoviesByCountry(country) {
    throw new Error('Please implement this in inheritors')
  }
}
module.exports = { Movie }
