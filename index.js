/* eslint-disable prefer-const */

'use strict'

const puppeteer = require('puppeteer')
const moment = require('moment')
const { uniqBy, flattenDepth } = require('lodash')

const { Notifications } = require('./src/lib/Notifications')
const {
  ScrapperImp: ScrapperImpCinepolis
} = require('./src/implementations/cinepolis/ScrapperImp')
const {
  ScrapperImp: ScrapperImpCinemex
} = require('./src/implementations/cinemex/ScrapperImp')
const {
  BrandImp: BrandImpCinepolis
} = require('./src/implementations/cinepolis/BrandImp')
const {
  BrandImp: BrandImpCinemex
} = require('./src/implementations/cinemex/BrandImp')
const {
  MoviesByCityImp: MoviesByCityImpCinepolis
} = require('./src/implementations/cinepolis/MoviesByCityImp')
const {
  MoviesByCityImp: MoviesByCityImpCinemex
} = require('./src/implementations/cinemex/MoviesByCityImp')
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

const brandScrapper = async (enable, retry, name, paramsScrapper) => {
  return Promise.resolve()
    .then(() => {
      logger.info(`Starting ${name}. Enable: ${enable}`)
    })
    .then(async () => {
      if (enable) {
        const scrapperImp = new paramsScrapper.ScrapperImp(
          paramsScrapper.page,
          paramsScrapper.movieRestriction,
          paramsScrapper.brandOptions,
          paramsScrapper.BrandImp,
          paramsScrapper.MoviesByCityImp,
          paramsScrapper.LocationsByMovieAndCityImp,
          paramsScrapper.SchedulesByMovieCityAndLocationImp,
          paramsScrapper.methods
        )
        await scrapperImp.start()
        const finalMsg = `Brand ${name} items count: ${scrapperImp.itemsScrapped.length}`
        logger.info(finalMsg)
        return finalMsg
      }
      return `Brand ${name} items count: 0 cause it's disable`
    })
    .catch(error => {
      logger.error(`Fail something with '${name}'`)
      logger.error(error.message)

      // eslint-disable-next-line no-param-reassign
      retry -= 1
      if (retry > 0) {
        logger.info(`One more time, retry remaining: ${retry}`)
        return brandScrapper(enable, retry, name, paramsScrapper)
      }
      const finalMsg = `No more retries for ${name}`
      logger.info(finalMsg)
      return finalMsg
    })
}

const cinepolisScrapper = () =>
  brandScrapper(
    config.get('variables.cinepolis'),
    config.get('variables.retry'),
    'cinepolisScrapper',
    {
      page,
      movieRestriction: config.get('variables.movie_restriction'),
      brandOptions: {
        nameBrand: 'Cinépolis',
        baseUrl: 'http://cinepolis.com',
        momentToFilter: moment()
          .locale('es')
          .add(config.get('variables.days'), 'days')
      },
      ScrapperImp: ScrapperImpCinepolis,
      BrandImp: BrandImpCinepolis,
      MoviesByCityImp: MoviesByCityImpCinepolis,
      LocationsByMovieAndCityImp: LocationsByMovieAndCityImpCinepolis,
      SchedulesByMovieCityAndLocationImp: SchedulesByMovieCityAndLocationImpCinepolis,
      methods: { uniqBy, flattenDepth }
    }
  )

const cinemexScrapper = () =>
  brandScrapper(
    config.get('variables.cinemex'),
    config.get('variables.retry'),
    'cinemexScrapper',
    {
      page,
      movieRestriction: config.get('variables.movie_restriction'),
      brandOptions: {
        nameBrand: 'Cinemex',
        baseUrl: 'http://cinemex.com',
        momentToFilter: moment()
          .locale('es')
          .add(config.get('variables.days'), 'days')
      },
      ScrapperImp: ScrapperImpCinemex,
      BrandImp: BrandImpCinemex,
      MoviesByCityImp: MoviesByCityImpCinemex,
      LocationsByMovieAndCityImp: undefined,
      SchedulesByMovieCityAndLocationImp: undefined,
      methods: { uniqBy, flattenDepth }
    }
  )

const publishAndExit = async (publishFunction, message, codeExit) => {
  if (codeExit !== 0) logger.error(message)
  await publishFunction(`${message}`, logger.path)
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
    .then(async () => {
      return {
        cinepolis: await cinepolisScrapper(),
        cinemex: await cinemexScrapper()
      }
    })
    .then(async result => {
      logger.info(`Closing Puppeteer`)
      await browser.close()
      return result
    })
    .then(result =>
      publishAndExit(
        Notifications.publishSuccess,
        `Everything was fine: ${JSON.stringify(result, null, 4)}}`,
        0
      )
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
