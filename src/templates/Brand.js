/* eslint-disable class-methods-use-this */

'use strict'

class Brand {
  constructor(name, page) {
    this._name = name
    this._page = page
    this._logo = ''
    this._countries = [
      /* {key:1, value:cdmx-center} */
    ]
  }

  async startScrapper() {
    await this.scrapeLogo()
    await this.scrapeCountries()
  }

  async scrapeLogo() {
    throw new Error('Please implement this in inheritors')
  }

  async scrapeCountries() {
    throw new Error('Please implement this in inheritors')
  }

  get countries() {
    return this._countries
  }

  get json() {
    return {
      countries: this._countries,
      name: this._name,
      logo: this._logo
    }
  }
}

module.exports = { Brand }
