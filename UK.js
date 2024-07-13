import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import XLSX from "xlsx";
import xlsjs from "xlsjs";

export default async function UnitedKingdom(clearDirectory) {
  const downloadPath = path.resolve("./downloads");
  const downloadF8Path = path.resolve("./downloadsFiltered_art8");
  const downloadF9Path = path.resolve("./downloadsFiltered_art9");

  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
  } else {
    await clearDirectory(downloadPath);
  }
  if (!fs.existsSync(downloadF8Path)) {
    fs.mkdirSync(downloadF8Path);
  } else {
    await clearDirectory(downloadF8Path);
  }
  if (!fs.existsSync(downloadF9Path)) {
    fs.mkdirSync(downloadF9Path);
  } else {
    await clearDirectory(downloadF9Path);
  }

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 10,
  });
  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadPath,
  });

  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(
    "https://www.blackrock.com/uk/products/product-list#/?productView=all&pageNumber=1&sortColumn=totalFundSizeInMillions&sortDirection=desc&dataView=perfDiscrete"
  );
  await page.waitForSelector("#onetrust-accept-btn-handler");
  await page.click("#onetrust-accept-btn-handler");
  await page.waitForSelector("screener-download-funds");
  await page.click("h1")
  await page.click("screener-download-funds > button");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await page.waitForSelector(".tertiary.left-align");
  await page.click(".tertiary.left-align");
  await new Promise((resolve) => setTimeout(resolve, 15000));

  //filtrar art 8
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadF8Path,
  });
  await page.waitForSelector("screener-filter-dropdown");
  await page.click("h1")
  const filtros = await page.$$("screener-filter-dropdown");
  await filtros[6].click();
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await page.click("h1")
  await page.click("mat-checkbox");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await page.click("screener-download-funds > button");
  await page.click("screener-download-funds > button");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const descargas = await page.$$(".tertiary.left-align");
  await descargas[1].click();
  await new Promise((resolve) => setTimeout(resolve, 10000));

  //filtrar art 9
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadF9Path,
  });
  const filtros2 = await page.$$("screener-filter-dropdown");
  await filtros2[6].click();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  //borrar filtros
  await page.click("#filter-reset-button > div");
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await page.click("h1")
  const articulos = await page.$$("mat-checkbox");
  await articulos[1].click();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await page.click("screener-download-funds");
  await page.click("screener-download-funds");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await descargas[1].click();
  await new Promise((resolve) => setTimeout(resolve, 10000));
  await browser.close();

  //Productos sin filtrar
  const files = fs.readdirSync(downloadPath);
  const excelFile = files.find((file) => file.endsWith(".xls"));
  if (!excelFile) {
    console.log("archivo no encontrado");
    return;
  }

  const files2 = fs.readdirSync(downloadF8Path);
  const excelFiltered8 = files2.find((file) => file.endsWith(".xls"));
  if (!excelFile) {
    console.log("archivo no encontrado");
    return;
  }

  const files3 = fs.readdirSync(downloadF9Path);
  const excelFiltered9 = files3.find((file) => file.endsWith(".xls"));
  if (!excelFile) {
    console.log("archivo no encontrado");
    return;
  }

  // leer y guardar archivo excel de todos los productos
  const filePath = path.resolve(downloadPath, excelFile);
  try {
    const workbook = xlsjs.readFile(filePath);
    // cambiar de formato
    const newWorkbook = XLSX.utils.book_new();
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      XLSX.utils.book_append_sheet(newWorkbook, worksheet, sheetName);
    });

    let dateObj = new Date();
    let month = String(dateObj.getMonth() + 1).padStart(2, "0");
    let day = String(dateObj.getDate()).padStart(2, "0");
    let year = dateObj.getFullYear();

    const pais = "United_Kingdom";
    const date = day + "-" + month + "-" + year;
    const NewName = `Productos - ${pais} - ${date}.xlsx`;
    const newFolderPath = path.resolve("./processed_files/all_funds");

    // Asegurarse de que el directorio existe
    if (!fs.existsSync(newFolderPath)) {
      fs.mkdirSync(newFolderPath, { recursive: true });
    }

    const newFilePath = path.resolve(newFolderPath, NewName);
    XLSX.writeFile(newWorkbook, newFilePath);

    console.log(`Archivo guardado como: ${newFilePath}`);
  } catch (error) {
    console.log("error: " + error);
  }

  // leer y guardar archivo excel productos filtrados por art 8
  const filePath8 = path.resolve(downloadF8Path, excelFiltered8);
  try {
    const workbook = xlsjs.readFile(filePath8);
    // cambiar de formato
    const newWorkbook = XLSX.utils.book_new();
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      XLSX.utils.book_append_sheet(newWorkbook, worksheet, sheetName);
    });

    let dateObj = new Date();
    let month = String(dateObj.getMonth() + 1).padStart(2, "0");
    let day = String(dateObj.getDate()).padStart(2, "0");
    let year = dateObj.getFullYear();

    const pais = "United_Kingdom";
    const date = day + "-" + month + "-" + year;
    const NewName = `Productos (art.8) - ${pais} - ${date}.xlsx`;
    const newFolderPath = path.resolve("./processed_files/Filtered_Article_8");

    // Asegurarse de que el directorio existe
    if (!fs.existsSync(newFolderPath)) {
      fs.mkdirSync(newFolderPath, { recursive: true });
    }

    const newFilePath = path.resolve(newFolderPath, NewName);
    XLSX.writeFile(newWorkbook, newFilePath);

    console.log(`Archivo guardado como: ${newFilePath}`);
  } catch (error) {
    console.log("error: " + error);
  }

  // leer y guardar archivo excel productos filtrados por art 9
  const filePath9 = path.resolve(downloadF9Path, excelFiltered9);
  try {
    const workbook = xlsjs.readFile(filePath9);
    // cambiar de formato
    const newWorkbook = XLSX.utils.book_new();
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      XLSX.utils.book_append_sheet(newWorkbook, worksheet, sheetName);
    });

    let dateObj = new Date();
    let month = String(dateObj.getMonth() + 1).padStart(2, "0");
    let day = String(dateObj.getDate()).padStart(2, "0");
    let year = dateObj.getFullYear();

    const pais = "United_Kingdom";
    const date = day + "-" + month + "-" + year;
    const NewName = `Productos (art.9) - ${pais} - ${date}.xlsx`;
    const newFolderPath = path.resolve("./processed_files/Filtered_Article_9");

    // Asegurarse de que el directorio existe
    if (!fs.existsSync(newFolderPath)) {
      fs.mkdirSync(newFolderPath, { recursive: true });
    }

    const newFilePath = path.resolve(newFolderPath, NewName);
    XLSX.writeFile(newWorkbook, newFilePath);

    console.log(`Archivo guardado como: ${newFilePath}`);
  } catch (error) {
    console.log("error: " + error);
  }
}
