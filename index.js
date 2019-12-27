'use strict'

const util = require('util')

const puppeteer = require('puppeteer')
const { uniqBy, flattenDepth } = require('lodash')

const {
  ScrapperImp: ScrapperImpCinepolis
} = require('./src/implementations/cinepolis/ScrapperImp')
const {
  BrandImp: BrandImpCinepolis
} = require('./src/implementations/cinepolis/BrandImp')
const {
  MovieImp: MovieImpCinepolis
} = require('./src/implementations/cinepolis/MovieImp')
const {
  ScrapperImp: ScrapperImpCinemex
} = require('./src/implementations/cinemex/ScrapperImp')
const {
  BrandImp: BrandImpCinemex
} = require('./src/implementations/cinemex/BrandImp')

const run = async () => {
  try {
    console.log('start')

    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    await page.setViewport({ width: 1000, height: 800 })

    /**
     * BRAND CINEPOLIS
     */
    const brandImpCinepolis = new BrandImpCinepolis('Cinépolis', page)
    const movieImpCinepolis = new MovieImpCinepolis(page)
    const scrapperImpCinepolis = new ScrapperImpCinepolis(
      'http://cinepolis.com',
      brandImpCinepolis,
      movieImpCinepolis,
      page,
      { uniqBy, flattenDepth }
    )
    await scrapperImpCinepolis.start()

    const nextObj = await scrapperImpCinepolis.next()
    console.log('--------> Next')
    console.log(util.inspect(nextObj, false, null, true /* enable colors */))

    /**
     * BRAND CINEMEX
     */
    /*const brandImpCinemex = new BrandImpCinemex(
      'http://cinemex.com',
      'Cinemex',
      page
    )
    const scrapperImpCinemex = new ScrapperImpCinemex(brandImpCinemex, page)
    await scrapperImpCinemex.start()

    const nextObj2 = await scrapperImpCinemex.next()
    console.log('--------> Next2', nextObj2)
    */
    await browser.close()
  } catch (e) {
    console.log(e)
  }
}

run()
