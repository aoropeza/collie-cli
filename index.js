"use strict";

const bluebird = require("bluebird");
const puppeteer = require("puppeteer");
const { flattenDepth, uniqBy } = require("lodash");

const optionsGoTo = {
  timeout: 0,
  waitUntil: "domcontentloaded"
};

const delay = time =>
  new Promise(resolve => {
    setTimeout(resolve, time);
  });

const waitForElements = async (selector, time, _page) => {
  let elementsToWait = await _page.$$(selector);

  if (elementsToWait.length > 0) {
    console.log(`many element for ${selector}, finishing`);

    await delay(time);
    return elementsToWait;
  }
  console.log(`zero elements for ${selector}, testing again in ${time} ms`);
  await delay(time);
  await waitForElements(selector, time, _page);
};

const scrapeMoviesInfo = async (city, _page) => {
  // select cities
  await _page.select("#cmbCiudadesCartelera", city);

  await waitForElements("ul.listCartelera>li", 200, _page);

  return _page.evaluate(() => {
    var allItemList = Array.from(
      document.querySelectorAll("ul.listCartelera>li")
    );

    var moviesNames = [];
    allItemList.forEach(movie => {
      var h1Title = movie.querySelector("h1");
      var anchorCover = movie.querySelector("figure");

      var anchorSchedules = null;
      if (movie.querySelector(".btn-call")) {
        var anchorsActions = Array.from(
          movie.querySelector(".btn-call").querySelectorAll("a")
        );

        anchorsActions.forEach(anchor => {
          var anchorClass = anchor.getAttribute("class");
          if (typeof anchorClass != "string") {
            anchorSchedules = anchor.getAttribute("href");
          }
        });
      }

      if (h1Title) {
        moviesNames.push({
          name: h1Title.innerText,
          cover: anchorCover
            ? anchorCover.querySelector("img").getAttribute("src")
            : null,
          anchorSchedules
        });
      }
    });
    return moviesNames;
  });
};

(async () => {
  try {
    const baseUrlBrand = "https://cinepolis.com/";
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 800 });
    await page.goto(baseUrlBrand, optionsGoTo);

    const cities = [
      {
        id: "20",
        key: "cdmx-centro"
      } /*,
      { id: "21", key: "cdmx-norte" },
      { id: "22", key: "cdmx-oriente" },
      { id: "23", key: "cdmx-poniente" },
      { id: "24", key: "cdmx-sur" }*/
    ];

    const arrayResults = await bluebird.mapSeries(cities, item =>
      scrapeMoviesInfo(item.id, page)
    );
    const resultUnique = uniqBy(flattenDepth(arrayResults), "name");

    console.log("Finishing getting movies for all cities:", resultUnique);

    const urlSchedules = `${baseUrlBrand}${resultUnique[0].anchorSchedules}`;

    console.log(`urlSchedules: ${urlSchedules}`);
    await page.goto(urlSchedules, optionsGoTo);

    await waitForElements(
      "#cmbComplejo_chosen>ul.chosen-choices>li.search-choice",
      200,
      page
    );

    delay(10000);
    const result = await page.evaluate(() => {
      var locations = Array.from(
        document.querySelectorAll(
          "#cmbComplejo_chosen>ul.chosen-choices>li.search-choice>span"
        )
      );

      var locationsNames = [];
      locations.forEach(location => {
        locationsNames.push({
          name: location.innerText
        });
      });
      return locationsNames;
    });

    console.log(`result locations: ${result.length}`);
    console.log(result);

    await browser.close();
  } catch (e) {
    console.log(e);
  }
})();
// bgpreload_Gris ng-hide
