import { chromium, Page } from "playwright";
import * as fs from "fs";
import pc from "picocolors";

import { PDFDocument } from 'pdf-lib';

const fsPromises = fs.promises;

let counter = 0;

interface Options {
  /**
   * The path  of the generated PDF file.
   */
  outputPath: string;
  /**
   * The first docs page to start generating the
   * PDF from.
   */
  firstDocsPath: string;
  /**
   * The 
   */
  baseUrl: string;
}

export async function run(options: Options) {
  const { firstDocsPath, baseUrl, outputPath } = options;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = `${baseUrl}${firstDocsPath}`;

  console.log(pc.green('Crawling docs: ' + url));

  await page.goto(url, { waitUntil: "networkidle" });
  await queryNextPage(page);

  await browser.close();

  await mergePdfOutput(outputPath);
}

async function generatePdfPage(page: Page) {
  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: 25,
      right: 35,
      bottom: 25,
      left: 35,
    },
  });

  const dir = `dist/tmp`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await fsPromises.writeFile(`dist/tmp/${counter++}.pdf`, pdf);

  console.log(pc.green(`Generated PDF: dist/tmp/${counter - 1}.pdf`));
}

async function queryNextPage(page: Page) {
  await generatePdfPage(page);

  const hasNextButton = await page.$(".pagination-nav__link--next");

  if (hasNextButton) {
    const nextPageButton = page.locator(".pagination-nav__link--next");

    if (nextPageButton) {
      await nextPageButton.click();
      await queryNextPage(page);
    }
  }
}

async function mergePdfOutput(outputPath: string) {
  const outputPdf = await PDFDocument.create();
  for (let i = 0; i < counter; i++) {
    try {
      const pdfBuffer = fs.readFileSync(`dist/tmp/${i}.pdf`);
      const donarPdf = await PDFDocument.load(pdfBuffer);
      const pages = await outputPdf.copyPages(donarPdf, donarPdf.getPageIndices());
      for (const page of pages) {
        outputPdf.addPage(page);
      }
    } catch (err) {
      console.error(pc.red(err as string));
    }
  }
  const buffer = await outputPdf.save();
  fs.rmSync("dist/tmp", { recursive: true, force: true });
  await fsPromises.writeFile(outputPath, buffer);
}
