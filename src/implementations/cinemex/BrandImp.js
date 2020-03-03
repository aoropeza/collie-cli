'use strict'

const { Brand } = require('../../templates/Brand')
const { Config } = require('../../config')
const { Logger } = require('../../logger')

const config = new Config()

const logger = new Logger('collie:cli:Imp:Cinemex:BrandImp', 2, [102, 255, 102])

class BrandImp extends Brand {
  async scrapeLogo() {
    try {
      await this._page.waitForSelector('#site-logo', config.waitForOptions)
      const logo = await this._page.$('#site-logo a')
      // TODO
      //logo.screenshot({ path: 'logo.png' })
      this._logo = 'logo.png'
    } catch (error) {
      logger.error(error)
      throw Error(error)
    }

    logger.info(`scrapeLogo() logo: ${this._logo}`)
  }

  async scrapeCities() {
    try {
      await this._page.waitForSelector(
        '#header-area-select',
        config.waitForOptions
      )

      const allCities = await this._page.$$eval(
        '#header-area-select>optgroup option',
        options =>
          options.map(items => {
            return {
              id: items.getAttribute('value'),
              url: items.getAttribute('data-url'),
              text: items.getAttribute('data-display-text')
            }
          })
      )

      this._cities = allCities.filter(
        item =>
          item.text &&
          (item.text.includes('CDMX') || item.text.includes('cdmx'))
      )
      logger.info(`scrapeCities() ${this._cities.length} cities found`)
    } catch (error) {
      logger.error(error)
      throw Error(error)
    }
  }
}

module.exports = { BrandImp }
