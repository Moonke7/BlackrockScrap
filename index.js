import puppeteer from "puppeteer";
import { fromEmitterEvent } from "puppeteer";
import path from "path";
import fs from "fs";
import XLSX from "xlsx";
import xlsjs from "xlsjs";
import GoToBrazil from "./GoToBrazil.js";
import AmericasOffShors from "./GoToAmericaOffShors.js";
import Canada from "./Canada.js";
import Colombia from "./Colombia.js";
import Luxemburg from "./Luxemburg.js";
import Mexico from "./Mexico.js";
import UnitedKingdom from "./UK.js";
import UnitedStates from "./UnitedStates.js";

async function clearDirectory(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const filePath = path.join(directoryPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        clearDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });
  }
}

async function DownloadAndProcess() {
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
    "https://www.blackrock.com/cl/productos/lista-de-producto#type=all&style=All&view=perfNav&pageSize=10&pageNumber=1&sortColumn=fundName&sortDirection=asc"
  );
  await page.waitForSelector("#onetrust-accept-btn-handler");
  await page.click("#onetrust-accept-btn-handler");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await page.waitForSelector("px-download-funds");
  await page.click("px-download-funds");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await page.waitForSelector(".wrapper.aria-clickable");
  await page.click(".wrapper.aria-clickable");
  await new Promise((resolve) => setTimeout(resolve, 10000));

  //filtrar art 8
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadF8Path,
  });
  await page.click("#filter-button-text-aladdinEsgClassification");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const articulos = await page.$$(".filter-item-holder.tabbabels");
  await articulos[23].click();
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await page.click("px-download-funds");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const descargas = await page.$$(".wrapper.aria-clickable");
  await descargas[1].click();
  await new Promise((resolve) => setTimeout(resolve, 6000));

  //filtrar art 9
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadF9Path,
  });
  await page.click("#filter-button-text-aladdinEsgClassification");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  //borrar filtros
  const filter = await page.$$(".reset.focus-back2-host");
  await filter[5].click();
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const articulos2 = await page.$$(".filter-item-holder.tabbabels");
  await articulos2[24].click();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await page.click("px-download-funds");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const descargas2 = await page.$$(".wrapper.aria-clickable");
  await descargas2[1].click();
  await new Promise((resolve) => setTimeout(resolve, 6000));
  await browser.close();

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

  // lee el xls
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

    const pais = "Chile";
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

    const pais = "Chile";
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

    const pais = "Chile";
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
async function executeFunctionsSequentially() {
  await DownloadAndProcess();
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await GoToBrazil(clearDirectory);
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await AmericasOffShors(clearDirectory);
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await Canada(clearDirectory);
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await Colombia(clearDirectory);
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await UnitedKingdom(clearDirectory);
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await Mexico(clearDirectory);
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await UnitedStates(clearDirectory);
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await Luxemburg(clearDirectory);
  await new Promise((resolve) => setTimeout(resolve, 3000));
}

executeFunctionsSequentially();
