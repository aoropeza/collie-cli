'use strict'

const { MoviesBy } = require('../../templates/MoviesBy')
const logger = require('../../logger')(
  'collie:cli:Template:Cinepolis:MoviesByCityImp'
)

class MoviesByCityImp extends MoviesBy {
  async startScrapper() {
    logger.info('startScrapper')
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
          : {}
      })
    )
    this._movies = allMovies.filter(item => Object.keys(item).length > 0)
  }
}

module.exports = { MoviesByCityImp }
