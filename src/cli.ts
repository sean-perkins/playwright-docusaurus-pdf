import pc from "picocolors";
import { program } from "commander";

import { run } from "./api";

program
  .option(
    "-o, --output-file <type>",
    "The location of the generated PDF file."
  )
  .option('-base-url, --base-url <type>', 'The base url of the website to generate the PDF from.')
  .option('-p, --path <type>', 'The first docs page path to generate the PDF from.')
  .option('-f, --format <type>', 'The page format of the generated PDF.')
  .option('-r, --replace <type>', 'Replaces all baseUrl links with the provided string.')
  .option('-d, --delay <type>', 'A delay to wait for generating the PDF page. Allows for JavaScript hydration to complete.');

program.parse(process.argv);

const options = program.opts();

if (options.outputFile && options.baseUrl && options.path) {
  run({
    baseUrl: options.baseUrl,
    firstDocsPath: options.path,
    outputPath: options.outputFile,
    format: options.format,
    baseUrlReplacement: options.replace,
    pageDelay: options.delay,
  }).then(() => {
    console.log(pc.green("PDF generated successfully!"));
    process.exit(0);
  }).catch(err => {
    console.error(pc.red(err.message));
    process.exit(1);
  });
} else {
  console.error(pc.red("Please provide all required arguments."));
  process.exit(1);
}
