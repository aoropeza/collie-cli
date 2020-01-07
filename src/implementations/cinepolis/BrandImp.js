'use strict'

const { Brand } = require('../../templates/Brand')
const { Config } = require('../../config')
const logger = require('../../logger')('collie:cli:Template:Cinepolis:BrandImp')

class BrandImp extends Brand {
  async scrapeLogo() {
    logger.info('scrapeLogo')
    await this._page.waitForSelector('#img_logomaster', Config.waitForOptions)
    this._logo = await this._page.$eval('#img_logomaster', el => el.src)
  }

  async scrapeCities() {
    logger.info('scrapeCities')
    await this._page.waitForSelector('#cmbCiudades', Config.waitForOptions)
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
  }
}

module.exports = { BrandImp }
