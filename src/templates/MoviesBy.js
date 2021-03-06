/* eslint-disable class-methods-use-this */

'use strict'

const { Logger } = require('../logger')

const logger = new Logger('collie:cli:Template:MoviesBy', 0, [153, 153, 153])

class MoviesBy {
  constructor(page, filter, baseUrl, { uniqBy }) {
    this._page = page
    this._filter = filter
    this._movies = []
    this._baseUrl = baseUrl
    this._uniqBy = uniqBy
  }

  async startScrapper() {
    logger.info('startScrapper()')
    throw new Error('Please implement this in inheritors')
  }

  get movies() {
    return this._movies
  }
}
module.exports = { MoviesBy }
