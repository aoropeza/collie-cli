'use strict'

const { Brand } = require('../../templates/Brand')
const { Config } = require('../../config')

class BrandImp extends Brand {
  async scrapeLogo() {
    await this._page.waitForSelector('#img_logomaster', Config.waitForOptions)
    this._logo = await this._page.$eval('#img_logomaster', el => el.src)
  }

  async scrapeCountries() {
    await this._page.waitForSelector('#cmbCiudades', Config.waitForOptions)
    const allCountries = await this._page.$$eval(
      '#cmbCiudades>option',
      options =>
        options.map(items => {
          return {
            id: items.getAttribute('value'),
            key: items.getAttribute('clave'),
            text: items.innerText
          }
        })
    )
    this._countries = allCountries.filter(
      item => item.text.includes('CDMX') || item.text.includes('cdmx')
    )
  }
}

module.exports = { BrandImp }
