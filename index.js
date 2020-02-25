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
let retries = config.get('retry')

const preparePuppeteer = async () => {
  logger.info(`Preparing Puppeteer`)
  const options = {
    headless: true,
    ...(config.get('docker_env')
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
  logger.info(`Closing Puppeteer`)
  await browser.close()
}
// eslint-disable-next-line consistent-return
const cinepolisScrapper = async () => {
  logger.info(`Starting Cinepolis Scrapper. Enable: ${config.get('cinepolis')}`)
  if (config.get('cinepolis')) {
    try {
      const scrapperImpCinepolis = new ScrapperImpCinepolis(
        page,
        config.get('movie_restriction'),
        {
          nameBrand: 'Cinépolis',
          baseUrl: 'http://cinepolis.com',
          momentToFilter: moment()
            .locale('es')
            .add(config.get('days'), 'days')
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
      logger.info(`Fail something with 'cinepolisScrapper'`)
      logger.info(JSON.stringify(e))

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
  logger.info(`Starting Cinemex Scrapper. Enable: ${config.get('cinemex')}`)
  /*if (config.get('cinemex')) {
    console.log('scrapping cinemex...')
  }*/
}

const handleFatalError = async err => {
  const messageToLog = `Exception. Message: ${err.message}, Stack: ${err.stack}`
  logger.fatal(messageToLog)
  await Notifications.publishError(messageToLog)
  process.exit(1)
}
;(async () =>
  Promise.resolve()
    .then(() => {
      logger.info(`Running for env: ${config.get('env')}`)
    })
    .then(preparePuppeteer)
    .then(cinepolisScrapper)
    .then(cinemexScrapper)
    .then(closePuppeteer)
    .then(() =>
      logger
        .fullLog()
        .then(log =>
          Notifications.publishSuccess(`Everything was fine: \n${log}`)
        )
        .then(() => process.exit(0))
    )
    .catch(err => {
      logger.error(err.message)
      Notifications.publishError(`Exception: ${err.message}`).then(() =>
        process.exit(0)
      )
    }))()

process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)
