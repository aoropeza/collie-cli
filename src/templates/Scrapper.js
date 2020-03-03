/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

'use strict'

const { UsesCases } = require('collie-uses-cases')

const { Config } = require('../config')
const { Logger } = require('../logger')

const logger = new Logger('collie:cli:Template:Scrapper', 1, [0, 153, 255])
const config = new Config()

class Scrapper extends Array {
  constructor(
    page,
    movieRestriction,
    { nameBrand, baseUrl, momentToFilter },
    BrandImpClass,
    MoviesByCityImpClass,
    LocationsByMovieAndCityImpClass,
    SchedulesByMovieCityAndLocationImpClass,
    { uniqBy, flattenDepth }
  ) {
    super()
    this._baseUrl = baseUrl
    this._page = page
    this._movieRestriction = movieRestriction
    this._momentToFilter = momentToFilter
    this.lastKeyUrl = ''

    this._brand = new BrandImpClass(nameBrand, this._page)
    this._MoviesByCityImpClass = MoviesByCityImpClass
    this._LocationsByMovieAndCityImpClass = LocationsByMovieAndCityImpClass
    this._SchedulesByMovieCityAndLocationImpClass = SchedulesByMovieCityAndLocationImpClass

    this._uniqBy = uniqBy
    this._flattenDepth = flattenDepth

    this._cities = []
    this._movies = []
    this._moviesByCityMerged = []
    this._locations = []
  }

  async start() {
    const log = `start() Starting. Getting info from: ${this._momentToFilter}`
    logger.info(log)

    await this._page.goto(this._baseUrl, config.gotoOptions)

    await this._brand.startScrapper()

    this._movies = await this.gettingAllMovies()
    // this._movies = {{ movie:{name: 'Judy',cover:'http://logo.jpg',anchorSchedule: 'path/judy'},city: { id: '20', key: 'cdmx-centro', text: 'CDMX Centro' }}}

    return
    for (const movieByCountry of this._movies) {
      await this.goOrNotGo(movieByCountry.movie.anchorSchedule)

      const locationsByMovieAndCity = new this._LocationsByMovieAndCityImpClass(
        this._page,
        {
          movie: movieByCountry.movie,
          city: movieByCountry.city
        }
      )
      await locationsByMovieAndCity.startScrapper()
      this._locations.push(locationsByMovieAndCity)
      // locationsByMovieAndCity.locations = [{ name: 'Cinépolis VIP Plaza Satélite', index: '0' }]

      for (const location of locationsByMovieAndCity.locations) {
        await locationsByMovieAndCity.unSelectLocations()

        const scheduleByMovieCityAndLocation = new this._SchedulesByMovieCityAndLocationImpClass(
          this._page,
          {
            selectedLocation: location,
            allLocations: locationsByMovieAndCity.locations,
            date: this._momentToFilter
          }
        )
        const times = await scheduleByMovieCityAndLocation.startScrapper()
        location.times = times
      }
    }

    await this.saveItemsScrapped()
    logger.info('End scrapping')
  }

  async goOrNotGo(newUrlKey) {
    if (this.lastKeyUrl !== newUrlKey) {
      this.lastKeyUrl = newUrlKey
      const gotoUrl = `${this._baseUrl}/${this.lastKeyUrl}`
      logger.info(`(goOrNotGo) Going to ${gotoUrl}`)
      try {
        await this._page.goto(gotoUrl, config.gotoOptions)
      } catch (error) {
        logger.info(error)
        throw Error(error)
      }
    }
  }

  async gettingAllMovies() {
    let movies = []
    for (const item of this._brand.cities) {
      const moviesByCountry = new this._MoviesByCityImpClass(
        this._page,
        item,
        this._baseUrl,
        { uniqBy: this._uniqBy }
      )
      await moviesByCountry.startScrapper()
      movies = movies.concat(moviesByCountry.movies)
    }

    if (this._movieRestriction.enable) {
      logger.info(
        `MovieRestriction enable. Scrapping just for ${this._movieRestriction.names}`
      )

      const whiteListMovies = this._movieRestriction.names
        .split(',')
        .map(x => x.toLowerCase())
      movies = movies.filter(
        item =>
          whiteListMovies.filter(x => item.movie.name.toLowerCase().includes(x))
            .length > 0
      )
    }

    movies = movies.sort((x, y) => x.movie.name.localeCompare(y.movie.name))

    logger.info(
      `gettingAllMovies() ${movies.length}  movies of ${this._brand.cities.length} cities`
    )
    return movies
  }

  async saveItemsScrapped() {
    const options = {
      uriConnection: {
        protocol: `mongodb+srv`,
        database: config.get('variables.privates.db_name'),
        user: config.get('variables.privates.db_user'),
        password: config.get('variables.privates.db_pwd'),
        host: config.get('variables.privates.db_host')
      }
    }

    const usesCases = await UsesCases.buildStatic(options)
    const items = this.itemsScrapped.map(item =>
      usesCases.bulkSchedules(
        item.brand,
        item.location,
        item.movie,
        item.schedules
      )
    )

    logger.info('saveItemsScrapped() Saving scrapped items')
    await Promise.all(items)
  }

  // eslint-disable-next-line class-methods-use-this
  get itemsScrapped() {
    return this._flattenDepth(
      this._locations.map(element => {
        return element.locations
          .map(item => {
            return {
              brand: this._brand.json,
              movie: {
                name: element.filter.movie.name,
                cover: element.filter.movie.cover
              },
              location: {
                name: item.name,
                latitude: 19.449582,
                longitude: -99.0723182,
                address: 'xxx'
              },
              schedules: item.times
            }
          })
          .filter(item => item.schedules.length > 0)
      })
    )
  }
}

module.exports = { Scrapper }
