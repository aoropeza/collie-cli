'use strict'

const { Brand } = require('../../templates/Brand')
const { Config } = require('../../config')

const config = new Config()

class BrandImp extends Brand {
  async startScrapper() {
    await this._page.goto(this._baseUrl, config.gotoOptions)
    await this._page.waitForSelector('#site-logo>a', config.waitForOptions)
    const logoTmp = await this._page.$eval('#site-logo>a', el => {
      // eslint-disable-next-line no-undef
      return getComputedStyle(el).backgroundImage
    })
    this._logo = logoTmp.replace('url("', '').replace('")', '')
  }
}

module.exports = { BrandImp }
