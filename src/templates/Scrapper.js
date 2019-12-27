'use strict'

const { Config } = require('../config')

class Scrapper {
  constructor(baseUrl, brand, movie, page, { uniqBy, flattenDepth }) {
    this._baseUrl = baseUrl
    this._brand = brand
    this._movie = movie
    this._page = page
    this._uniqBy = uniqBy
    this._flattenDepth = flattenDepth

    this._movies = []
  }

  async start() {
    await this._page.goto(this._baseUrl, Config.gotoOptions)
    await this._brand.startScrapper()

    // eslint-disable-next-line no-restricted-syntax
    for (const item of this._brand.countries) {
      // eslint-disable-next-line no-await-in-loop
      const moviesTmp = await this._movie.startScrapeMoviesByCountry(item)
      this._movies.push(moviesTmp)
    }
    this._movies = this._uniqBy(this._flattenDepth(this._movies), 'name')
  }

  // eslint-disable-next-line class-methods-use-this
  next() {
    return {
      brand: this._brand.json,
      movies: this._movies
    }
  }
}

module.exports = { Scrapper }
