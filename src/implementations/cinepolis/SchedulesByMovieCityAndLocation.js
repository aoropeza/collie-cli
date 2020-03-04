/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

'use strict'

const moment = require('moment')

const { SchedulesBy } = require('../../templates/SchedulesBy')
const { Logger } = require('../../logger')

const logger = new Logger(
  'collie:cli:Imp:Cinepolis:SchedulesByMovieCityAndLocation',
  5,
  [204, 255, 153]
)

class SchedulesByMovieCityAndLocation extends SchedulesBy {
  async startScrapper() {
    let duration = ''
    let promisesToScrappedTimes = []

    try {
      await this._page.click(
        `#cmbComplejo_chosen ul.chosen-choices>li.search-field>input`,
        { clickCount: 3 }
      )
      await this._page.keyboard.press('Backspace')

      await this._page.type(
        `#cmbComplejo_chosen ul.chosen-choices>li.search-field>input`,
        this._filter.selectedLocation.name,
        { delay: 100 }
      )

      const selector = `#cmbComplejo_chosen ul.chosen-results>li.active-result[data-option-array-index="${this._filter.selectedLocation.index}"]`
      const button = await this._page.$(selector)
      await button.click()

      await this._page.select('#cmbFechas', this._filter.date.format('DD MMMM'))

      /**
       * Scrapping: Getting times
       */
      duration = await this._page.$eval(
        '#ContentPlaceHolder1_ctl_sinopsis_ctl_duracion',
        el => el.innerText
      )

      const timesHandles = await this._page.$$(
        'div.location:not(.locationHide) time>a'
      )
      promisesToScrappedTimes = timesHandles.map(item =>
        this._page.evaluate(timeHandle => {
          return {
            time: timeHandle.innerText
          }
        }, item)
      )
    } catch (error) {
      logger.error(error)
      throw Error(error)
    }

    const times = await Promise.all(promisesToScrappedTimes)

    logger.info(
      `startScrapper() ${times.length} times found at ${this._filter.selectedLocation.name}'`
    )

    return times.map(item => {
      return {
        startTime: moment(
          `${this._filter.date.format('YYYY-MM-DD')} ${item.time}`,
          'YYYY-MM-DD H:mm'
        ).utcOffset(0),
        duration,
        // TODO
        typeRoom: 'kids'
      }
    })
  }
}
module.exports = { SchedulesByMovieCityAndLocation }
