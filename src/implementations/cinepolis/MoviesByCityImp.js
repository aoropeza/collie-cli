'use strict'

const { MoviesBy } = require('../../templates/MoviesBy')
const { Logger } = require('../../logger')

const logger = new Logger('collie:cli:Imp:Cinepolis:MoviesByCityImp', 3, [
  204,
  102,
  255
])

class MoviesByCityImp extends MoviesBy {
  async startScrapper() {
    const mainSelector = 'ul.listCartelera>li'
    await this._page.select('#cmbCiudadesCartelera', this._filter.id)

    await this._page.waitFor(
      selector => {
        // eslint-disable-next-line no-undef
        return document.querySelectorAll(selector).length > 0
      },
      {},
      mainSelector
    )
    const allMovies = await this._page.$$eval(mainSelector, liElements =>
      liElements.map(item => {
        // eslint-disable-next-line no-var
        var isMovieItem = !!item.querySelector('h1')
        return isMovieItem
          ? {
              movie: {
                name: item.querySelector('h1').innerText,
                cover: item
                  .querySelector('figure')
                  .querySelector('img')
                  .getAttribute('src'),
                anchorSchedule: item
                  .querySelector('.btn-call')
                  .querySelector('a[onclick*="LinkSinopsis"]')
                  .getAttribute('href')
              }
            }
          : {}
      })
    )
    this._movies = allMovies.filter(item => Object.keys(item).length > 0)
    this._movies = this._movies.map(item =>
      Object.assign(item, { city: this._filter })
    )
    logger.info(
      `startScrapper() ${this._movies.length} movies found for ${this._filter.key} citie`
    )
  }
}

module.exports = { MoviesByCityImp }
