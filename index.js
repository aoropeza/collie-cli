'use strict'

require('dotenv').config()

const args = require('args')
const puppeteer = require('puppeteer')
const moment = require('moment')
const { uniqBy, flattenDepth } = require('lodash')

const logger = require('./src/logger')('collie:cli:Main:index')
const {
  ScrapperImp: ScrapperImpCinepolis
} = require('./src/implementations/cinepolis/ScrapperImp')
const {
  BrandImp: BrandImpCinepolis
} = require('./src/implementations/cinepolis/BrandImp')
const {
  MoviesByCityImp: MoviesByCityImpCinepolis
} = require('./src/implementations/cinepolis/MoviesByCityImp')
const {
  LocationsByMovieAndCity: LocationsByMovieAndCityImpCinepolis
} = require('./src/implementations/cinepolis/LocationsByMovieAndCity')
const {
  SchedulesByMovieCityAndLocation: SchedulesByMovieCityAndLocationImpCinepolis
} = require('./src/implementations/cinepolis/SchedulesByMovieCityAndLocation')
const {
  ScrapperImp: ScrapperImpCinemex
} = require('./src/implementations/cinemex/ScrapperImp')
const {
  BrandImp: BrandImpCinemex
} = require('./src/implementations/cinemex/BrandImp')

args
  .option(
    ['t', 'timeoutpage'],
    'Max timeout in milliseconds to wait a page.',
    60000
  )
  .option(
    ['o', 'timeoutobject'],
    'Max timeout in milliseconds to wait an object.',
    60
  )
  .option(['d', 'days'], 'How many day in the future(1 means tomorrow)', 1)
  .option(['c', 'cinepolis'], 'Run script for this specific brand.')
  .option(['x', 'cinemex'], 'Run script for this specific brand.')
  .option(
    'maxmovies',
    'Max number of movies to scrapped. Default all movies found.'
  )
  .option('retry', 'Max number of times to retried the script by brand.', 2)

const flags = args.parse(process.argv)
let browser
let page
let retries = flags.retry

const preparePuppeteer = async () => {
  browser = await puppeteer.launch({ headless: false })
  page = await browser.newPage()
  await page.setViewport({ width: 1000, height: 800 })
}

const closePuppeteer = async () => {
  await browser.close()
}
const cinepolisScrapper = async () => {
  try {
    const scrapperImpCinepolis = new ScrapperImpCinepolis(
      page,
      flags.maxmovies,
      {
        nameBrand: 'Cinépolis',
        baseUrl: 'http://cinepolis.com',
        momentToFilter: moment()
          .locale('es')
          .add(flags.days, 'days')
      },
      BrandImpCinepolis,
      MoviesByCityImpCinepolis,
      LocationsByMovieAndCityImpCinepolis,
      SchedulesByMovieCityAndLocationImpCinepolis,
      { uniqBy, flattenDepth }
    )
    await scrapperImpCinepolis.start()
    logger.info('Results from cinepolis')
    logger.info(JSON.stringify(scrapperImpCinepolis.itemsScrapped))
  } catch (e) {
    logger.info(`Fail something with 'cinepolisScrapper'`)
    logger.info(e)

    retries -= 1
    if (retries <= 0) {
      logger.info(`No more retries, throwing error...`)
      throw Error(`No more retries for 'cinepolisScrapper'`)
    } else {
      logger.info(`One more time, retry remaining: ${retries}`)
      return cinepolisScrapper()
    }
  }
}

const cinemexScrapper = async () => {}

const run = async () => {
  if (flags.cinepolis || flags.cinemex) {
    try {
      await preparePuppeteer()
      if (flags.cinepolis) {
        await cinepolisScrapper()
      }
      if (flags.cinemex) {
        await cinemexScrapper()
      }
    } catch (e) {
      logger.info(`Catch for end main run`)
      logger.info(e)
    } finally {
      await closePuppeteer()
      process.exit(0)
    }
  } else {
    args.showHelp()
  }
}

run()
