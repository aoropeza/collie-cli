/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

'use strict'

const { SchedulesBy } = require('../../templates/SchedulesBy')
const logger = require('../../logger')(
  'collie:cli:Template:Cinepolis:SchedulesByMovieCityAndLocation'
)

class SchedulesByMovieCityAndLocation extends SchedulesBy {
  async startScrapper() {
    logger.info('startScrapper')
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

    logger.info(selector)
    await this._page.select('#cmbFechas', this._filter.date)

    /**
     * Scrapping: Getting times
     */
    const timesHandles = await this._page.$$(
      'div.location:not(.locationHide) time>a'
    )
    const promisesToScrappedTimes = timesHandles.map(item =>
      this._page.evaluate(timeHandle => {
        return {
          time: timeHandle.innerText
        }
      }, item)
    )
    const times = await Promise.all(promisesToScrappedTimes)
    logger.info('times: ')
    logger.info(times)
  }
}
module.exports = { SchedulesByMovieCityAndLocation }
