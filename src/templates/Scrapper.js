/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

'use strict'

const { Config } = require('../config')
const logger = require('../logger')('collie:cli:Template:Scrapper')

class Scrapper {
  constructor(
    page,
    { nameBrand, baseUrl, dateToFilter },
    BrandImpClass,
    MoviesByCityImpClass,
    LocationsByMovieAndCityImpClass,
    SchedulesByMovieCityAndLocationImpClass,
    { uniqBy, flattenDepth }
  ) {
    this._baseUrl = baseUrl
    this._page = page
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
    await this._page.goto(this._baseUrl, Config.gotoOptions)
    /**
     * Getting all CITIES in this._brand.cities
     */
    await this._brand.startScrapper()

    this._movies = await this.gettingAllMovies()
    this._movies = this._movies.slice(18, 19)
    logger.info('==========')
    logger.info(this._movies)

    this._moviesByCityMerged = await this.mergeMoviesByCountry()

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
      logger.info(
        `locationsByMovieAndCity.locations: `,
        locationsByMovieAndCity.locations.length
      )

      for (const location of locationsByMovieAndCity.locations) {
        logger.info(
          `movie: ${locationsByMovieAndCity.filter.movie.name}, location: ${location.name}`
        )
        const scheduleByMovieCityAndLocation = new this._SchedulesByMovieCityAndLocationImpClass(
          this._page,
          {
            selectedLocation: location,
            allLocations: locationsByMovieAndCity.locations,
            date: this._dateToFilter
          }
        )
        await scheduleByMovieCityAndLocation.startScrapper()
      }
    }
  }

  async goOrNotGo(newUrlKey) {
    if (this.lastKeyUrl !== newUrlKey) {
      this.lastKeyUrl = newUrlKey
      const gotoUrl = `${this._baseUrl}/${this.lastKeyUrl}`
      logger.info(`gotoUrl: ${gotoUrl}`)
      await this._page.goto(gotoUrl, Config.gotoOptions)
    }
  }

  async gettingAllMovies() {
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
    const moviesByCity = []
    for (const movie of this._movies) {
      for (const city of this._brand.cities) {
        moviesByCity.push({ movie, city })
      }
    }
    return moviesByCity
  }

  // eslint-disable-next-line class-methods-use-this
  next() {
    return {
      brand: this._brand.json,
      /*movies: this._uniqBy(
        this._flattenDepth(this._movies.map(item => item.movies)),
        'name'
      ),*/
      locations: this._locations.map(item => {
        return { filter: item.filter, locations: item.locations }
      })
    }
  }
}

module.exports = { Scrapper }
