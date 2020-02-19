/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

'use strict'

const { LocationsBy } = require('../../templates/LocationsBy')
const { Config } = require('../../config')
const { Logger } = require('../../logger')

const logger = new Logger('collie:cli:Imp:Cinepolis:LocationsByMovieAndCity')

class LocationsByMovieAndCity extends LocationsBy {
  constructor(page, filter) {
    super(page, filter)
    this._selectorForActiveLocations =
      '#cmbComplejo_chosen>ul.chosen-choices>li.search-choice'
  }

  async buildAllSelectedLocations() {
    const allLocations = await this._page.$$eval(
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
    return allLocations.filter(item => Object.keys(item).length > 0)
  }

  async scrapeLocations() {
    logger.info(`[Method] scrapeLocations`)
    logger.info(`Setting country: ${this._filter.city.key}`)

    try {
      await this._page.waitFor(
        `#cmbCiudadesHorario>option[value*="${this._filter.city.key}"]`,
        Config.waitForOptionsImmediately
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
      logger.info(`All locations count: ${this._locations.length}`)
      logger.info(this._locations)
    } catch (e) {
      logger.error(`Movie don't have locations for this citie`)
    }
  }

  async unSelectLocations() {
    logger.info('[Method] unSelectLocations')

    const currentSelectedlocations = await this.buildAllSelectedLocations()
    logger.info(`Locations to unselected: ${currentSelectedlocations.length}`)

    for (const location of currentSelectedlocations) {
      const selector = `#cmbComplejo_chosen>ul.chosen-choices>li.search-choice>a[data-option-array-index="${location.index}"]`
      const button = await this._page.$(selector)
      try {
        await button.click()
      } catch (e) {
        logger.error(`button click error ${e}`)
      }
    }
  }
}
module.exports = { LocationsByMovieAndCity }
