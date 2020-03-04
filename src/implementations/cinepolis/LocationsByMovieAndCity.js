/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

'use strict'

const { LocationsBy } = require('../../templates/LocationsBy')
const { Config } = require('../../config')
const { Logger } = require('../../logger')

const config = new Config()

const logger = new Logger(
  'collie:cli:Imp:Cinepolis:LocationsByMovieAndCity',
  4,
  [102, 255, 204]
)

class LocationsByMovieAndCity extends LocationsBy {
  constructor(page, filter) {
    super(page, filter)
    this._selectorForActiveLocations =
      '#cmbComplejo_chosen>ul.chosen-choices>li.search-choice'
  }

  async buildAllSelectedLocations() {
    let allLocations = []
    try {
      allLocations = await this._page.$$eval(
        this._selectorForActiveLocations,
        liElements =>
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
    } catch (error) {
      logger.error(error)
      throw Error(error)
    }
    return allLocations.filter(item => Object.keys(item).length > 0)
  }

  async scrapeLocations() {
    try {
      await this._page.waitFor(
        `#cmbCiudadesHorario>option[value*="${this._filter.city.key}"]`,
        config.waitForOptions
      )
      await this._page.select('#cmbCiudadesHorario', this._filter.city.key)
      await this._page.waitFor(5000)

      await this._page.waitFor(
        selector => {
          // eslint-disable-next-line no-undef
          return document.querySelectorAll(selector).length > 0
        },
        {},
        this._selectorForActiveLocations
      )

      this._locations = await this.buildAllSelectedLocations()
      logger.info(
        `scrapeLocations() ${this._locations.length} locations found for '${this._filter.movie.name}' in '${this._filter.city.key}'`
      )
      logger.info(this._locations.map(item => item.name).join(', '))
    } catch (error) {
      logger.error(
        `scrapeLocations() '${this._filter.movie.name}' doesn't have locations in '${this._filter.city.key}'`
      )
      throw Error(error)
    }
  }

  async unSelectLocations() {
    logger.info('[Method] unSelectLocations')

    const currentSelectedlocations = await this.buildAllSelectedLocations()
    logger.info(`Locations to unselected: ${currentSelectedlocations.length}`)

    for (const location of currentSelectedlocations) {
      try {
        const selector = `#cmbComplejo_chosen>ul.chosen-choices>li.search-choice>a[data-option-array-index="${location.index}"]`
        const button = await this._page.$(selector)
        await button.click()
      } catch (error) {
        logger.error(`button click error ${error.message}`)
        throw Error(error)
      }
    }
  }
}
module.exports = { LocationsByMovieAndCity }
