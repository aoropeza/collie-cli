'use strict'

const { Brand } = require('../../templates/Brand')
const { Config } = require('../../config')
const { Logger } = require('../../logger')

const config = new Config()

const logger = new Logger('collie:cli:Imp:Cinepolis:BrandImp', 2, [
  102,
  255,
  102
])

class BrandImp extends Brand {
  async scrapeLogo() {
    await this._page.waitForSelector('#img_logomaster', config.waitForOptions)
    this._logo = await this._page.$eval('#img_logomaster', el => el.src)

    logger.info(`scrapeLogo() logo: ${this._logo}`)
  }

  async scrapeCities() {
    await this._page.waitForSelector('#cmbCiudades', config.waitForOptions)
    const allCities = await this._page.$$eval('#cmbCiudades>option', options =>
      options.map(items => {
        return {
          id: items.getAttribute('value'),
          key: items.getAttribute('clave'),
          text: items.innerText
        }
      })
    )
    this._cities = allCities.filter(
      item => item.text.includes('CDMX') || item.text.includes('cdmx')
    )
    logger.info(`scrapeCities() ${this._cities.length} cities found`)
  }
}

module.exports = { BrandImp }
