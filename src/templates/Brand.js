/* eslint-disable class-methods-use-this */

'use strict'

class Brand {
  constructor(name, page) {
    this._name = name
    this._page = page
    this._logo = ''
    this._cities = [
      /* {key:1, value:cdmx-center} */
    ]
  }

  async startScrapper() {
    await this.scrapeLogo()
    await this.scrapeCities()
  }

  async scrapeLogo() {
    throw new Error('Please implement this in inheritors')
  }

  async scrapeCities() {
    throw new Error('Please implement this in inheritors')
  }

  get cities() {
    return this._cities
  }

  get json() {
    return {
      cities: this._cities,
      name: this._name,
      logo: this._logo
    }
  }
}

module.exports = { Brand }
