import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import XLSX from "xlsx";
import xlsjs from "xlsjs";

export default async function Canada(clearDirectory) {
  const downloadPath = path.resolve("./downloads");

  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath);
  } else {
    await clearDirectory(downloadPath);
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
    "https://www.blackrock.com/ca/investors/en/products/product-list#type=ishares&style=All&view=perfNav&pageSize=25&pageNumber=1&sortColumn=totalNetAssets&sortDirection=desc"
  );
  await page.waitForSelector("#onetrust-accept-btn-handler");
  await page.click("#onetrust-accept-btn-handler");
  await new Promise((resolve) => setTimeout(resolve, 1500));
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

    const pais = "Canada";
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
}
