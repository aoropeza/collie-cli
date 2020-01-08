/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

'use strict'

const { Config } = require('../config')
const logger = require('../logger')('collie:cli:Template:Scrapper')

class Scrapper extends Array {
  constructor(
    page,
    maxmovies,
    { nameBrand, baseUrl, dateToFilter },
    BrandImpClass,
    MoviesByCityImpClass,
    LocationsByMovieAndCityImpClass,
    SchedulesByMovieCityAndLocationImpClass,
    { uniqBy, flattenDepth }
  ) {
    super()
    this._baseUrl = baseUrl
    this._page = page
    this._maxmovies = maxmovies
    this._dateToFilter = dateToFilter
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
    logger.info('[Method] start')
    await this._page.goto(this._baseUrl, Config.gotoOptions)

    await this._brand.startScrapper()

    this._movies = await this.gettingAllMovies()
    if (this._maxmovies) {
      this._movies = this._movies.slice(0, this._maxmovies)
    }

    this._moviesByCityMerged = await this.mergeMoviesByCountry()
    logger.info(`MoviesByCityMerged count: ${this._moviesByCityMerged.length}`)

    for (const movieByCountry of this._moviesByCityMerged) {
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

      for (const location of locationsByMovieAndCity.locations) {
        await locationsByMovieAndCity.unSelectLocations()

        const scheduleByMovieCityAndLocation = new this._SchedulesByMovieCityAndLocationImpClass(
          this._page,
          {
            selectedLocation: location,
            allLocations: locationsByMovieAndCity.locations,
            date: this._dateToFilter
          }
        )
        const times = await scheduleByMovieCityAndLocation.startScrapper()
        location.times = times
      }
    }
  }

  async goOrNotGo(newUrlKey) {
    logger.info('[Method] goOrNotGo')
    if (this.lastKeyUrl !== newUrlKey) {
      this.lastKeyUrl = newUrlKey
      const gotoUrl = `${this._baseUrl}/${this.lastKeyUrl}`
      logger.info(`Goto: ${gotoUrl}`)
      await this._page.goto(gotoUrl, Config.gotoOptions)
    }
  }

  async gettingAllMovies() {
    logger.info('[Method] gettingAllMovies')
    let movies = []
    for (const item of this._brand.cities) {
      const moviesByCountry = new this._MoviesByCityImpClass(this._page, item)
      await moviesByCountry.startScrapper()
      movies.push(moviesByCountry)
    }
    /**
     * Zipping and Unique
     */
    movies = this._uniqBy(
      this._flattenDepth(movies.map(item => item.movies)),
      'name'
    )

    return movies
  }

  async mergeMoviesByCountry() {
    logger.info('[Method] mergeMoviesByCountry')
    const moviesByCity = []
    for (const movie of this._movies) {
      for (const city of this._brand.cities) {
        moviesByCity.push({ movie, city })
      }
    }
    return moviesByCity
  }

  // eslint-disable-next-line class-methods-use-this
  get itemsScrapped() {
    return this._flattenDepth(
      this._locations.map(element => {
        return element.locations.map(item => {
          return {
            brand: this._brand.json,
            movie: {
              name: element.filter.movie.name,
              cover: element.filter.movie.cover
            },
            location: {
              name: item.name
            },
            schedules: item.times
          }
        })
      })
    )
  }
}

module.exports = { Scrapper }
