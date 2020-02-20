/* eslint-disable class-methods-use-this */

'use strict'

const { Logger } = require('../logger')

const logger = new Logger('collie:cli:Template:Brand', 2, [153, 153, 153])

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
    logger.info('startScrapper()')
    await this.scrapeLogo()
    await this.scrapeCities()
  }

  async scrapeLogo() {
    logger.info('scrapeLogo()')
    throw new Error('Please implement this in inheritors')
  }

  async scrapeCities() {
    logger.info('scrapeCities()')
    throw new Error('Please implement this in inheritors')
  }

  get cities() {
    return this._cities
  }

  get json() {
    return {
      name: this._name,
      logo: this._logo
    }
  }
}

module.exports = { Brand }
