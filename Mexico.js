import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import XLSX from "xlsx";
import xlsjs from "xlsjs";

export default async function Mexico(clearDirectory) {
  const downloadPath = path.resolve("./downloads");
  const downloadETFsPath = path.resolve("./download_ETFs");

  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
  } else {
    await clearDirectory(downloadPath);
  }
  if (!fs.existsSync(downloadETFsPath)) {
    fs.mkdirSync(downloadETFsPath);
  } else {
    await clearDirectory(downloadETFsPath);
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
    "https://www.blackrock.com/mx/intermediarios/productos/lista-de-producto#type=mutualFunds&style=All&view=perfNav&pageSize=25&pageNumber=1&sortColumn=undefined&sortDirection=asc"
  );
  await page.waitForSelector("#onetrust-accept-btn-handler");
  await page.click("#onetrust-accept-btn-handler");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await page.waitForSelector("px-download-funds");
  await page.click("px-download-funds");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await page.click(".wrapper.aria-clickable");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  //Descargar fondos ETFs
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadETFsPath,
  });
  await page.waitForSelector("#filter-button-text-productInit");
  await page.click("#filter-button-text-productInit");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await page.waitForSelector("pill-button");
  const Etfs = await page.$$("pill-button");
  await Etfs[1].click();
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await page.click("h1");
  await page.waitForSelector("px-download-funds");
  await page.click("px-download-funds");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await page.click(".wrapper.aria-clickable");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  await browser.close();

  const files = fs.readdirSync(downloadPath);
  const excelFile = files.find((file) => file.endsWith(".xls"));
  if (!excelFile) {
    console.log("archivo no encontrado");
    return;
  }

  const files2 = fs.readdirSync(downloadPath);
  const excelFileETF = files.find((file) => file.endsWith(".xls"));
  if (!excelFileETF) {
    console.log("archivo no encontrado");
    return;
  }

  // lee el xls
  const filePath = path.resolve(downloadPath, excelFile);
  const filePath2 = path.resolve(downloadETFsPath, excelFileETF);

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

    const pais = "Mexico";
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

  try {
    const workbook = xlsjs.readFile(filePath2);
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

    const pais = "Mexico";
    const date = day + "-" + month + "-" + year;
    const NewName = `Productos_ETFs - ${pais} - ${date}.xlsx`;
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
}
