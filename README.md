<p align="center">
  <img src="https://github.com/sean-perkins/playwright-docusaurus-pdf/blob/main/.github/assets/docusaurus-logo.svg?raw=true" width="60" />
  +
  <img src="https://github.com/sean-perkins/playwright-docusaurus-pdf/blob/main/.github/assets/playwright-logo.svg?raw=true" width="60">
</p>

<h1 align="center">
  Playwright Docusaurus PDF
</h1>

> **This project is still in active development. You can clone or fork the repository to use in your own projects.**

PDF generator for Docusaurus 2.0+ using Playwright. Playwright will crawl your local site or published site to generate a PDF for all the available pages within the docs instance.

If you need to generate multiple PDFs for separate docs instances, invoke the CLI with the different base paths for the site.

## Usage

```
npx playwright-docusaurus-pdf -o ./dist/output.pdf -base-url http://localhost:3000 -p /docs/welcome
```

### Options

### `-o`, `--output-file`

The destination path for the generated PDF.

### `-base-url`, `--base-url`

The URL to open to crawl with playwright.

### `-p`, `--path`

The initial page path to open.

#### `-d`, `--delay`

The option delay to add to page loads before capturing the image for the PDF. Used to offset long JavaScript render delays.

#### `-r`, `--replace`

Replace all instances of the `baseUrl` in link tags with a destination url. Used to replace local environment urls with a production url.

#### `-f`, `--format`

The page format such as `A4`. If unspecified, each page will resize to the scrollable width and height of the webpage.

## Development

### Install dependencies

```
npm install
```

### Build

```
npm run build
```

### Link the package locally

To test the CLI locally, run the following command to link the `/dist` output with your global package registry.

```
npm link
```
