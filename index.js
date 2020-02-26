'use strict'

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
const { Logger } = require('./src/logger')
const { Config } = require('./src/config')

const logger = new Logger('collie:cli:Main:index', 0, [0, 204, 0])
const config = new Config()

let browser
let page
let retries = config.get('variables.retry')

const preparePuppeteer = async () => {
  logger.info(`Preparing Puppeteer`)
  const options = {
    headless: true,
    ...(config.get('variables.docker_env')
      ? {
          executablePath: '/usr/bin/chromium-browser',
          args: [
            '--disable-setuid-sandbox',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--full-memory-crash-report'
          ]
        }
      : {})
  }

  browser = await puppeteer.launch(options)
  page = await browser.newPage()
  await page.setViewport({ width: 1000, height: 800 })
}

// eslint-disable-next-line consistent-return
const cinepolisScrapper = async () => {
  logger.info(
    `Starting Cinepolis Scrapper. Enable: ${config.get('variables.cinepolis')}`
  )
  if (config.get('variables.cinepolis')) {
    try {
      const scrapperImpCinepolis = new ScrapperImpCinepolis(
        page,
        config.get('variables.movie_restriction'),
        {
          nameBrand: 'Cinépolis',
          baseUrl: 'http://cinepolis.com',
          momentToFilter: moment()
            .locale('es')
            .add(config.get('variables.days'), 'days')
        },
        BrandImpCinepolis,
        MoviesByCityImpCinepolis,
        LocationsByMovieAndCityImpCinepolis,
        SchedulesByMovieCityAndLocationImpCinepolis,
        { uniqBy, flattenDepth }
      )
      await scrapperImpCinepolis.start()
      logger.info(
        `Cinepolis items count: ${scrapperImpCinepolis.itemsScrapped.length}`
      )
    } catch (e) {
      logger.error(`Fail something with 'cinepolisScrapper'`)
      logger.error(JSON.stringify(e))

      retries -= 1
      if (retries <= 0) {
        logger.info(`No more retries, throwing error...`)
        throw Error(`No more retries for 'cinepolisScrapper'`)
      }
      logger.info(`One more time, retry remaining: ${retries}`)
      return cinepolisScrapper()
    }
  }
}

const cinemexScrapper = async () => {
  logger.info(
    `Starting Cinemex Scrapper. Enable: ${config.get('variables.cinemex')}`
  )
}
const publishAndExit = async (publishFunction, message, codeExit) => {
  if (codeExit !== 0) logger.error(message)
  const log = await logger.fullLog()
  await publishFunction(`${message}: \n${log}`)
  process.exit(codeExit)
}

const handleFatalError = async err =>
  publishAndExit(
    Notifications.publishError,
    `Exception. Message: ${err.message}, Stack: ${err.stack}`,
    1
  )

;(async () =>
  Promise.resolve()
    .then(() => {
      logger.info(`Running for env: ${config.get('variables.env')}`)
      const { privates, ...vars } = config.get('variables')
      return Notifications.publish(`Starting: ${JSON.stringify(vars, null, 4)}`)
    })
    .then(preparePuppeteer)
    .then(cinepolisScrapper)
    .then(cinemexScrapper)
    .then(() => {
      logger.info(`Closing Puppeteer`)
      return browser.close()
    })
    .then(() =>
      publishAndExit(Notifications.publishSuccess, 'Everything was fine', 0)
    )
    .catch(err =>
      publishAndExit(
        Notifications.publishError,
        `Exception. Message: ${err.message}, Stack: ${err.stack}`,
        1
      )
    ))()

process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)
