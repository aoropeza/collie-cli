"use strict";

var bluebird = require("bluebird");
const puppeteer = require("puppeteer");

const delay = time =>
  new Promise(resolve => {
    setTimeout(resolve, time);
  });

const waitToElementDisappear = async (elementId, time, _page) => {
  let loading = await _page.$$(elementId);

  if (loading.length > 0) {
    console.log(
      `element ${elementId} still exists, testing again in ${time} ms`
    );

    await delay(time);
    await waitToElementDisappear(elementId, time, _page);
  }
};

const getMoviesName = async (city, _page) => {
  // select cities
  await _page.select("#cmbCiudadesCartelera", city);

  await waitToElementDisappear("#preloadCartelera", 200, _page);

  return _page.evaluate(() => {
    var allItemList = Array.from(
      document.querySelectorAll("ul.listCartelera>li")
    );

    var moviesNames = [];
    allItemList.forEach(movie => {
      var h1Title = movie.querySelector("h1");
      if (h1Title) {
        moviesNames.push(h1Title.innerText);
      }
    });
    return moviesNames;
  });
};

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 800 });
    await page.goto("https://cinepolis.com/", {
      timeout: 0,
      waitUntil: "domcontentloaded"
    });

    // 20 CDMX Centro
    // 21 CDMX Norte
    // 22 CDMX Oriente
    // 23 CDMX Poniente
    // 24 CDMX Sur

    const cities = [
      { "20": "CDMX Centro" },
      { "21": "CDMX Norte" },
      { "22": "CDMX Oriente" },
      { "23": "CDMX Poniente" },
      { "24": "CDMX Sur" }
    ];

    const result = await bluebird.mapSeries(cities, item =>
      getMoviesName(Object.keys(item)[0], page)
    );

    console.log("moviesNames", result);

    await browser.close();
  } catch (e) {
    console.log(e);
  }
})();
