/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

'use strict'

const { LocationsBy } = require('../../templates/LocationsBy')

class LocationsByCountryMovie extends LocationsBy {
  async scrapeLocations() {
    console.log(`Setting country: ${this._filter.country.key}`)

    await this._page.waitFor(1000)
    await this._page.select('#cmbCiudadesHorario', this._filter.country.key)
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
          index: item.querySelector('a').getAttribute('data-option-array-index')
        }
      })
    )
    this._locations = allLocations.filter(item => Object.keys(item).length > 0)
  }

  async unSelectLocation() {
    for (const location of this._locations) {
      console.log(
        `#cmbComplejo_chosen>ul.chosen-choices>li.search-choice>a[data-option-array-index="${location.index}"]`
      )
      const button = await this._page.$(
        `#cmbComplejo_chosen>ul.chosen-choices>li.search-choice>a[data-option-array-index="${location.index}"]`
      )
      await button.click()
    }
  }
}
module.exports = { LocationsByCountryMovie }
