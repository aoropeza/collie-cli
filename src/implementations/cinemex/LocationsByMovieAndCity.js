/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

'use strict'

const moment = require('moment')

const { LocationsBy } = require('../../templates/LocationsBy')
const { Config } = require('../../config')
const { Logger } = require('../../logger')

const config = new Config()

const logger = new Logger('collie:cli:Imp:Cinemex:LocationsByMovieAndCity', 4, [
  102,
  255,
  204
])

class LocationsByMovieAndCity extends LocationsBy {
  constructor(page, filter) {
    super(page, filter)
    this._selectorForActiveLocations = '.billboard-block.cinema-match'
  }

  async scrapeLocations() {
    try {
      await this._page.waitFor(
        `#billboard-movie>option[value*="${this._filter.movie.id}"]`,
        config.waitForOptions
      )
      await this._page.select('#billboard-movie', this._filter.movie.id)
      await this._page.waitFor('#billboard-main:not(.loading)')

      this._locations = await this.buildAllSelectedLocations()
      logger.info(
        `scrapeLocations() ${this._locations.length} locations found for '${this._filter.movie.name}' in '${this._filter.city.text}'`
      )
      logger.info(this._locations.map(item => item.name).join(', '))
    } catch (error) {
      logger.error(
        `scrapeLocations() '${this._filter.movie.name}' doesn't have locations in '${this._filter.city.text}'`
      )
      throw Error(error)
    }
  }

  async buildAllSelectedLocations() {
    let allLocations = []
    try {
      allLocations = await this._page.$$eval(
        this._selectorForActiveLocations,
        liElements =>
          liElements.map(item => {
            // eslint-disable-next-line prefer-destructuring
            const map = Array.prototype.map
            return {
              // https://medium.com/@roxeteer/javascript-one-liner-to-get-elements-text-content-without-its-child-nodes-8e59269d1e71
              name: Array.prototype.reduce.call(
                item.querySelector('h2').childNodes,
                (a, b) => {
                  return `${a}${b.nodeType === 3 ? b.textContent.trim() : ''}`
                },
                ''
              ),
              times: map.call(
                item.querySelectorAll(
                  '.mycinema-sessions-group.match-version .avail-high.match'
                ),
                itemTime => ({
                  time: itemTime.textContent,
                  // TODO
                  duration: 'N/A',
                  typeRoom: 'N/A'
                })
              )
            }
          })
      )
    } catch (error) {
      logger.error(error)
      throw Error(error)
    }

    return allLocations.map(item => ({
      ...item,
      times: item.times.map(itemTime => ({
        ...itemTime,
        startTime: moment(
          `${this._filter.date.format('YYYY-MM-DD')} ${itemTime.time}`,
          'YYYY-MM-DD hh:mm A'
        ).utcOffset(0)
      }))
    }))
  }

  // eslint-disable-next-line class-methods-use-this
  unSelectLocations() {}
}
module.exports = { LocationsByMovieAndCity }
