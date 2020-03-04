'use strict'

const { Config } = require('../../config')
const { MoviesBy } = require('../../templates/MoviesBy')
const { Logger } = require('../../logger')

const logger = new Logger('collie:cli:Imp:Cinemex:MoviesByCityImp', 3, [
  204,
  102,
  255
])
const config = new Config()

class MoviesByCityImp extends MoviesBy {
  async startScrapper() {
    const mainSelector = '.billboard-li.movie-match'
    let allMovies = []
    try {
      await this._page.goto(
        `${this._baseUrl}${this._filter.url}`,
        config.gotoOptions
      )
      await this._page.waitFor(
        selector => {
          // eslint-disable-next-line no-undef
          return document.querySelectorAll(selector).length > 0
        },
        {},
        mainSelector
      )

      allMovies = await this._page.$$eval(mainSelector, liElements =>
        liElements.map(item => {
          // eslint-disable-next-line no-var

          return {
            movie: {
              id: item.getAttribute('data-movie-id'),
              name: item.querySelector('.mycinema-item-title').innerText,
              cover: `https:${item
                .querySelector('.billboard-movie-poster')
                .querySelector('img')
                .getAttribute('src')}`
            }
          }
        })
      )
    } catch (error) {
      logger.error(error)
      throw Error(error)
    }

    const { url: anchorSchedule, ...city } = this._filter
    this._movies = allMovies.map(item => ({
      movie: { ...item.movie, anchorSchedule },
      city
    }))
    this._movies = this._uniqBy(this._movies, 'movie.name')
    logger.info(
      `startScrapper() ${this._movies.length} movies found for ${this._filter.text} citie`
    )
  }
}

module.exports = { MoviesByCityImp }
