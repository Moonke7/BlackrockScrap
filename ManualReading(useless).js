async function GetData() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 10,
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto(
    "https://www.blackrock.com/cl/productos/lista-de-producto#type=all&style=All&view=perfNav&pageSize=364&pageNumber=1&sortColumn=fundName&sortDirection=asc"
    //https://www.blackrock.com/cl/productos/lista-de-producto#type=all&style=All&view=perfNav&pageSize=100&pageNumber=1&sortColumn=totalNetAssetsFund&sortDirection=desc para 100 en ves de 25
  );

  await page.click("#onetrust-accept-btn-handler");

  const clickAllButtons = async () => {
    let buttons = await page.$$("div.dTd.fund-preview.flex-fixed > button");
    for (const button of buttons) {
      await button.click();
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  };

  // Presionar todos los botones dos veces
  await clickAllButtons();
  await clickAllButtons();
  console.log(`Todos los botones han sido presionados dos veces.`);

  await page.waitForSelector(".list-holder");

  // Esperar a que todos los datos estén presentes
  await page.waitForSelector(".list-holder");

  //CONSEGUIR DATOS LUEGO DE CARGAR BIEN LA PAGINA
  const data = await page.evaluate(() => {
    const Container = document.querySelectorAll(".fund-data.flex-stretch");
    let arr = [];

    Container.forEach((divs) => {
      const info = {};
      const tickerElement = divs.querySelector(
        "div.dTd.localExchangeTicker.ticker > div"
      );
      const nameElement = divs.querySelector(
        "div.dTd.fund-name-block.fundName > div:not([class]) > a"
      );
      const LaunchDate = divs.querySelector("div.dTd.inceptionDate");
      const AUM = divs.querySelector("div.dTd.totalNetAssetsFund");
      const secondaryRowDivs = divs.querySelectorAll(
        ".secondary-row.flex-wrap > div"
      );

      const section = divs.querySelector("app-fund-preview");
      const ulElement = section.querySelector(".list-holder > ul");
      const liElements = ulElement.querySelectorAll("li");

      info.ticker = tickerElement.innerText;
      info.name = nameElement.innerText;
      if (secondaryRowDivs.length > 0) {
        info.isin = secondaryRowDivs[2].innerText.trim();
        info.divisa = secondaryRowDivs[1].innerText.trim();
        info.class = secondaryRowDivs[0].innerText.trim();
      }
      info.AUM = AUM.innerText;
      info.domicilio = liElements[1].querySelectorAll("span")[1].innerText;
      info.benchmark = liElements[3].querySelectorAll("span")[1].innerText;
      info.LaunchDate = LaunchDate.innerText;

      arr.push(info);
    });

    return arr;
  });

  console.log(data);
  await page.close();
}