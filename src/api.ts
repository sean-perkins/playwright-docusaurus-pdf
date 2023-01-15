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
  /**
   * The format of the generated PDF. Can be used to make
   * the PDF pages printable on A4 paper.
   */
  format?: string; // A4 
  /**
   * Replaces all baseUrl links with the provided string.
   */
  baseUrlReplacement?: string;
  /**
   * A delay to wait for generating the PDF page. Allows for JavaScript
   * hydration to complete.
   */
  pageDelay?: number;
}

type GeneratePageOptions = Pick<Options, 'format' | 'baseUrlReplacement' | 'baseUrl' | 'pageDelay'>;

export async function run(options: Options) {
  const { firstDocsPath, baseUrl, outputPath } = options;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = `${baseUrl}${firstDocsPath}`;

  console.log(pc.green('Crawling docs: ' + url));

  await page.goto(url, { waitUntil: "networkidle" });
  
  await queryNextPage(page, options);

  await browser.close();

  await mergePdfOutput(outputPath);
}

async function generatePdfPage(page: Page, options: GeneratePageOptions) {
  if (options.pageDelay !== undefined) {
    // Adds delay to allow the page to load from JS hydration (need to make this an option).
    await page.waitForTimeout(options.pageDelay);
  }
  // Removes all elements with the class "hide-on-print" from the DOM.
  await page.evaluate(() => {
    document.querySelectorAll('.hide-on-print').forEach(function(el) {
      el.remove();
    });
  });

  if (options.baseUrlReplacement) {
    await page.evaluate(([baseUrl, baseUrlReplacement]) => {
      document.querySelectorAll('a').forEach(function(el) {
        el.href = el.href.replace(baseUrl, baseUrlReplacement);
      });
    }, [options.baseUrl, options.baseUrlReplacement]);
  }
  
  await page.waitForSelector('.hide-on-print', { state: 'detached' });

  // Get the full scroll height and width of the page.
  const { width, height } = await page.evaluate(() => {
    return {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    }
  });

  const pdf = await page.pdf({
    format: options?.format,
    width,
    height,
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

async function queryNextPage(page: Page, options: GeneratePageOptions) {
  await generatePdfPage(page, options);

  const hasNextButton = await page.$(".pagination-nav__link--next");

  if (hasNextButton) {
    const nextPageButton = page.locator(".pagination-nav__link--next");

    if (nextPageButton) {
      await nextPageButton.click();
      await queryNextPage(page, options);
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
