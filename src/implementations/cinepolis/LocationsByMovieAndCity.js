/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

'use strict'

const { LocationsBy } = require('../../templates/LocationsBy')
const { Config } = require('../../config')
const logger = require('../../logger')(
  'collie:cli:Imp:Cinepolis:LocationsByMovieAndCity'
)

class LocationsByMovieAndCity extends LocationsBy {
  async scrapeLocations() {
    logger.info(`[Method] scrapeLocations`)
    logger.info(`Setting country: ${this._filter.city.key}`)

    try {
      await this._page.waitFor(
        `#cmbCiudadesHorario>option[value*="${this._filter.city.key}"]`,
        Config.waitForOptionsImmediately
      )
      await this._page.select('#cmbCiudadesHorario', this._filter.city.key)
      await this._page.waitFor(1000)

      const mainSelector =
        '#cmbComplejo_chosen>ul.chosen-choices>li.search-choice'

      await this._page.waitFor(
        selector => {
          // eslint-disable-next-line no-undef
          return document.querySelectorAll(selector).length > 0
        },
        {},
        mainSelector
      )

      const allLocations = await this._page.$$eval(mainSelector, liElements =>
        liElements.map(item => {
          // eslint-disable-next-line no-var
          return {
            name: item.querySelector('span').innerText,
            index: item
              .querySelector('a')
              .getAttribute('data-option-array-index')
          }
        })
      )
      this._locations = allLocations.filter(
        item => Object.keys(item).length > 0
      )
    } catch (e) {
      logger.error(`Movie don't have locations for this citie`)
    }
  }

  async unSelectLocations() {
    logger.info('[Method] unSelectLocations')
    for (const location of this._locations) {
      const selector = `#cmbComplejo_chosen>ul.chosen-choices>li.search-choice>a[data-option-array-index="${location.index}"]`
      logger.info(`clicking ${selector}`)
      const button = await this._page.$(selector)
      await button.click()
    }
  }
}
module.exports = { LocationsByMovieAndCity }
