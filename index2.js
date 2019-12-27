'use strict'

const bluebird = require('bluebird')
const puppeteer = require('puppeteer')
const { flattenDepth, uniqBy } = require('lodash')

const timeToWait = 300

const optionsGoTo = {
  timeout: 0,
  waitUntil: 'domcontentloaded'
}

const delay = time =>
  new Promise(resolve => {
    setTimeout(resolve, time)
  })

const waitForElements = async (selector, time, _page) => {
  let elementsToWait = await _page.$$(selector)

  if (elementsToWait.length > 0) {
    console.log(`many element for ${selector}, finishing`)

    await delay(time)
    return elementsToWait
  }
  console.log(`zero elements for ${selector}, testing again in ${time} ms`)
  await delay(time)
  await waitForElements(selector, time, _page)
}

const scrapeMoviesInfoByCity = async (city, _page) => {
  // select city
  await _page.select('#cmbCiudadesCartelera', city)

  const mainSelector = 'ul.listCartelera>li'
  await waitForElements(mainSelector, timeToWait, _page)

  const moviesHandles = await _page.$$(mainSelector)
  const promisesToScrappedMovie = moviesHandles.map(item =>
    _page.evaluate(movieHandle => {
      var isMovieItem = !!movieHandle.querySelector('h1')

      return isMovieItem
        ? {
            name: movieHandle.querySelector('h1').innerText,
            cover: movieHandle
              .querySelector('figure')
              .querySelector('img')
              .getAttribute('src'),
            anchorSchedule: movieHandle
              .querySelector('.btn-call')
              .querySelector('a:not(.lnkCartelera)')
              .getAttribute('href')
          }
        : {}
    }, item)
  )
  const movies = await Promise.all(promisesToScrappedMovie)

  return movies.filter(item => Object.keys(item).length !== 0)
}

;(async () => {
  try {
    const baseUrlBrand = 'https://cinepolis.com/'
    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    await page.setViewport({ width: 1000, height: 800 })

    /**
     * Scrapping: Getting all movies
     */
    await page.goto(baseUrlBrand, optionsGoTo)

    const cities = [
      { id: '20', key: 'cdmx-centro' },
      { id: '21', key: 'cdmx-norte' },
      { id: '22', key: 'cdmx-oriente' },
      { id: '23', key: 'cdmx-poniente' },
      { id: '24', key: 'cdmx-sur' }
    ]

    const moviesByCities = await bluebird.mapSeries(cities, item =>
      scrapeMoviesInfoByCity(item.id, page)
    )
    const movies = uniqBy(flattenDepth(moviesByCities), 'name')
    console.log('Finished get movies for all cities')

    /**
     * Scrapping: Getting locations by movie
     */
    const urlSchedules = `${baseUrlBrand}${movies[0].anchorSchedule}`
    console.log(`urlSchedules: ${urlSchedules}`)

    await page.goto(urlSchedules, optionsGoTo)

    // select city
    await delay(1000)
    await page.select('#cmbCiudadesHorario', 'cdmx-centro')
    await delay(1000)

    const mainSelector =
      '#cmbComplejo_chosen>ul.chosen-choices>li.search-choice'
    await waitForElements(mainSelector, timeToWait, page)

    const locationsHandles = await page.$$(mainSelector)

    const promisesToScrappedLocations = locationsHandles.map(item =>
      page.evaluate(locationHandle => {
        return {
          name: locationHandle.querySelector('span').innerText,
          index: locationHandle
            .querySelector('a')
            .getAttribute('data-option-array-index')
        }
      }, item)
    )
    const locations = await Promise.all(promisesToScrappedLocations)

    console.log(`result locations: ${locations.length}`)
    console.log(locations)

    /**
     * Unselect all locations
     */
    await bluebird.mapSeries(locations, async item => {
      console.log(
        `#cmbComplejo_chosen>ul.chosen-choices>li.search-choice>a[data-option-array-index="${item.index}"]`
      )

      const button = await page.$(
        `#cmbComplejo_chosen>ul.chosen-choices>li.search-choice>a[data-option-array-index="${item.index}"]`
      )
      await button.click()
    })

    // TODO Guarantee all options are unselected

    /**
     * Select one by one
     */
    await delay(1000)
    await bluebird.mapSeries(locations, async item => {
      await page.click(
        `#cmbComplejo_chosen ul.chosen-choices>li.search-field>input`,
        { clickCount: 3 }
      )
      await page.keyboard.press('Backspace')

      await page.type(
        `#cmbComplejo_chosen ul.chosen-choices>li.search-field>input`,
        item.name,
        { delay: 100 }
      )

      const button = await page.$(
        `#cmbComplejo_chosen ul.chosen-results>li.active-result[data-option-array-index="${item.index}"]`
      )
      await button.click()

      console.log(
        `#cmbComplejo_chosen ul.chosen-results>li.active-result[data-option-array-index="${item.index}"]`
      )
      await page.select('#cmbFechas', '25 diciembre')

      /**
       * Scrapping: Getting times
       */
      const timesHandles = await page.$$(
        'div.location:not(.locationHide) time>a'
      )
      const promisesToScrappedTimes = timesHandles.map(item =>
        page.evaluate(timeHandle => {
          return {
            time: timeHandle.innerText
          }
        }, item)
      )
      const times = await Promise.all(promisesToScrappedTimes)
      console.log('times: ', times)

      await delay(2000)
    })

    await delay(100000)
    await browser.close()
  } catch (e) {
    console.log(e)
  }
})()
