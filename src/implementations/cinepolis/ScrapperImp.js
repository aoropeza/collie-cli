'use strict'

const { Scrapper } = require('../../templates/Scrapper')
const logger = require('../../logger')(
  'collie:cli:Template:Cinepolis:ScrapperImp'
)

class ScrapperImp extends Scrapper {}

module.exports = { ScrapperImp }
