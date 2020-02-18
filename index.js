'use strict'

require('dotenv').config()

const args = require('args')
const puppeteer = require('puppeteer')
const moment = require('moment')
const { uniqBy, flattenDepth } = require('lodash')

const { Notifications } = require('./src/lib/Notifications')
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
const Logger = require('./src/logger')

const logger = new Logger('collie:cli:Main:index')
/*
const {
  ScrapperImp: ScrapperImpCinemex
} = require('./src/implementations/cinemex/ScrapperImp')
const {
  BrandImp: BrandImpCinemex
} = require('./src/implementations/cinemex/BrandImp')
*/

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
    ['k', 'dockerenv'],
    'With this flag on this scrip will run in docker mode'
  )
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
  const options = {
    headless: true,
    ...(flags.dockerenv
      ? {
          executablePath: '/usr/bin/chromium-browser',
          args: ['--disable-setuid-sandbox', '--no-sandbox']
        }
      : {})
  }

  browser = await puppeteer.launch(options)
  page = await browser.newPage()
  await page.setViewport({ width: 1000, height: 800 })
}

const closePuppeteer = async () => {
  await browser.close()
}
// eslint-disable-next-line consistent-return
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
    }
    logger.info(`One more time, retry remaining: ${retries}`)
    return cinepolisScrapper()
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

      await Notifications.publish(`Collie CLI SUCCESS`, `All was fine`)
    } catch (err) {
      logger.info(`Catch for end main run`)
      logger.info(err)

      await Notifications.publish(
        `Collie CLI Exception`,
        `Catch for end main run: ${JSON.stringify(err)}`
      )
    } finally {
      await closePuppeteer()
      process.exit(0)
    }
  } else {
    args.showHelp()
  }
}

run()

const handleFatalError = async err => {
  await Notifications.publish(
    `Collie CLI FATAL ERROR`,
    `Catch for end main run: ${JSON.stringify(err)}`,
    'arn:aws:sns:us-east-1:675002411007:CollieCli-NotificationsWorker'
  )

  logger.fatal(`${'[fatal error]'} ${err.message}`)
  logger.fatal(err.stack)
  process.exit(1)
}

process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)
