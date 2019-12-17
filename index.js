const puppeteer = require("puppeteer");

const delay = time =>
  new Promise(resolve => {
    setTimeout(resolve, time);
  });

const waitToElementDisappear = async (elementId, time, page) => {
  let loading = await page.$$(elementId);

  if (loading.length > 0) {
    console.log("loading exists", loading);

    await delay(time);
    await waitToElementDisappear(elementId, time, page);
  } else {
    return;
  }
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

    await page.select("#cmbCiudadesCartelera", "24");

    await waitToElementDisappear("#preloadCartelera", 200, page);

    const li = await page.evaluate(() => {
      while (document.getElementById("preloadCartelera") != undefined) {
        console.log("waiting loading...");
      }
      var listMovies = Array.from(
        document.querySelectorAll("ul.listCartelera>li")
      );

      var moviesNames = [];
      listMovies.forEach(movie => {
        var h1Title = movie.querySelector("h1");
        if (h1Title) {
          moviesNames.push(h1Title.innerText);
        }
      });
      return moviesNames;
    });

    console.log("moviesNames", li);

    await browser.close();
  } catch (e) {
    console.log(e);
  }
})();
