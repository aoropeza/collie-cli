/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

'use strict'

const { Config } = require('../config')

class Scrapper {
  constructor(
    page,
    { nameBrand, baseUrl },
    BrandImpClass,
    MoviesByCountryImpClass,
    LocationsByCountryMovieImpClass,
    SchedulesByLocationMovieImpClass,
    { uniqBy, flattenDepth }
  ) {
    this._baseUrl = baseUrl
    this._page = page

    this._brand = new BrandImpClass(nameBrand, this._page)
    this._MoviesByCountryImpClass = MoviesByCountryImpClass
    this._LocationsByCountryMovieImpClass = LocationsByCountryMovieImpClass
    this._SchedulesByLocationMovieImpClass = SchedulesByLocationMovieImpClass

    this._uniqBy = uniqBy
    this._flattenDepth = flattenDepth

    this._movies = []
    this._locations = []
  }

  async start() {
    await this._page.goto(this._baseUrl, Config.gotoOptions)
    await this._brand.startScrapper()

    for (const item of this._brand.countries) {
      const moviesByCountry = new this._MoviesByCountryImpClass(
        this._page,
        item
      )
      await moviesByCountry.startScrapper()
      this._movies.push(moviesByCountry)
    }

    const moviesUniq = this._uniqBy(
      this._flattenDepth(this._movies.map(item => item.movies)),
      'name'
    )

    for (const movie of moviesUniq.slice(0, 2)) {
      const urlMovieDetail = `${this._baseUrl}/${movie.anchorSchedule}`
      console.log(`urlMovieDetail: ${urlMovieDetail}`)
      await this._page.goto(urlMovieDetail, Config.gotoOptions)

      for (const country of this._brand.countries) {
        const locationsByCountryMovie = new this._LocationsByCountryMovieImpClass(
          this._page,
          {
            movie,
            country
          }
        )
        await locationsByCountryMovie.startScrapper()
        this._locations.push(locationsByCountryMovie)
        console.log(
          `locationsByCountryMovie.locations: `,
          locationsByCountryMovie.locations.length
        )

        for (const location of locationsByCountryMovie.locations) {
          console.log(
            `movie: ${locationsByCountryMovie.filter.movie.name}, location: ${location.name}`
          )
          const scheduleByLocationsMovie = new this._SchedulesByLocationMovieImpClass(
            this._page,
            {
              selectedLocation: location,
              allLocations: locationsByCountryMovie.locations
            }
          )
          await scheduleByLocationsMovie.startScrapper()
        }
      }
    }
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
