// ============================================================
// REMIFY — MINIFY ALL CSS & JS
// ============================================================
// Original files are NEVER deleted or modified.
//
// Example:
//
// styles.css     → styles.min.css
// checkout.js    → checkout.min.js
//
// If the .min file already exists, it is deleted first
// and then regenerated from the current original file.
// ============================================================

import fs from "fs";
import path from "path";
import CleanCSS from "clean-css";
import { minify as terserMinify } from "terser";


// ============================================================
// CONFIG
// ============================================================

const FOLDER = path.dirname(new URL(import.meta.url).pathname)
  .replace(/^\/([A-Za-z]):/, "$1:")
  .replace(/\//g, path.sep);


// ============================================================
// FIX WINDOWS PATH
// ============================================================

const folder = decodeURIComponent(FOLDER);


// ============================================================
// COUNTERS
// ============================================================

let cssCount = 0;
let jsCount = 0;
let errors = 0;


// ============================================================
// HEADER
// ============================================================

console.log("");
console.log("=========================================");
console.log(" REMIFY — MINIFY CSS & JS");
console.log("=========================================");
console.log("");
console.log(`Scanning: ${folder}`);
console.log("");


// ============================================================
// GET FILES
// ============================================================

function getFiles(directory) {

  const files = [];

  const entries = fs.readdirSync(directory, {
    withFileTypes: true
  });

  for (const entry of entries) {

    const fullPath = path.join(
      directory,
      entry.name
    );


    // Ignore node_modules
    if (
      entry.isDirectory() &&
      entry.name === "node_modules"
    ) {
      continue;
    }


    // Ignore hidden/system directories
    if (
      entry.isDirectory() &&
      entry.name.startsWith(".")
    ) {
      continue;
    }


    if (entry.isDirectory()) {

      files.push(
        ...getFiles(fullPath)
      );

    } else {

      files.push(fullPath);

    }

  }

  return files;

}


// ============================================================
// MINIFY CSS
// ============================================================

async function minifyCSS(inputFile) {

  const relativePath =
    path.relative(folder, inputFile);


  const directory =
    path.dirname(inputFile);


  const filename =
    path.basename(inputFile);


  const baseName =
    path.basename(
      inputFile,
      ".css"
    );


  const outputFile =
    path.join(
      directory,
      `${baseName}.min.css`
    );


  try {

    // Read original CSS
    const css =
      fs.readFileSync(
        inputFile,
        "utf8"
      );


    // Minify
    const result =
      new CleanCSS({
        level: 2
      }).minify(css);


    if (result.errors.length) {

      throw new Error(
        result.errors.join("\n")
      );

    }


    // Delete old .min.css if it exists
    if (
      fs.existsSync(outputFile)
    ) {

      fs.unlinkSync(
        outputFile
      );

      console.log(
        `↻ Replacing: ${path.relative(folder, outputFile)}`
      );

    }


    // Create fresh minified file
    fs.writeFileSync(
      outputFile,
      result.styles,
      "utf8"
    );


    console.log(
      `✓ CSS: ${relativePath} → ${path.relative(folder, outputFile)}`
    );


    cssCount++;

  } catch (error) {

    console.error(
      `✗ CSS failed: ${relativePath}`
    );

    console.error(
      `  ${error.message}`
    );

    errors++;

  }

}


// ============================================================
// MINIFY JS
// ============================================================

async function minifyJS(inputFile) {

  const relativePath =
    path.relative(folder, inputFile);


  const directory =
    path.dirname(inputFile);


  const baseName =
    path.basename(
      inputFile,
      ".js"
    );


  const outputFile =
    path.join(
      directory,
      `${baseName}.min.js`
    );


  try {

    // Read original JS
    const js =
      fs.readFileSync(
        inputFile,
        "utf8"
      );


    // Minify
    const result =
      await terserMinify(js, {

        compress: true,

        mangle: true

      });


    if (!result.code) {

      throw new Error(
        "Terser produced no output."
      );

    }


    // Delete old .min.js if it exists
    if (
      fs.existsSync(outputFile)
    ) {

      fs.unlinkSync(
        outputFile
      );

      console.log(
        `↻ Replacing: ${path.relative(folder, outputFile)}`
      );

    }


    // Create fresh minified file
    fs.writeFileSync(
      outputFile,
      result.code,
      "utf8"
    );


    console.log(
      `✓ JS: ${relativePath} → ${path.relative(folder, outputFile)}`
    );


    jsCount++;

  } catch (error) {

    console.error(
      `✗ JS failed: ${relativePath}`
    );

    console.error(
      `  ${error.message}`
    );

    errors++;

  }

}


// ============================================================
// MAIN
// ============================================================

async function main() {

  try {

    const files =
      getFiles(folder);


    for (const file of files) {

      const filename =
        path.basename(file);


      // ------------------------------------------------------
      // CSS
      // ------------------------------------------------------

      if (
        filename.endsWith(".css") &&
        !filename.endsWith(".min.css")
      ) {

        await minifyCSS(file);

      }


      // ------------------------------------------------------
      // JS
      // ------------------------------------------------------

      if (
        filename.endsWith(".js") &&
        !filename.endsWith(".min.js") &&
        filename !== "minify-all.js"
      ) {

        await minifyJS(file);

      }

    }


    // ========================================================
    // SUMMARY
    // ========================================================

    console.log("");
    console.log("=========================================");
    console.log(" MINIFICATION COMPLETE");
    console.log("=========================================");
    console.log("");
    console.log(`CSS files minified: ${cssCount}`);
    console.log(`JS files minified:  ${jsCount}`);
    console.log(`Errors:             ${errors}`);
    console.log("");


    if (errors > 0) {

      console.log(
        "⚠ Finished with errors."
      );

      process.exitCode = 1;

    } else {

      console.log(
        "✓ All files minified successfully."
      );

    }

    console.log("");

  } catch (error) {

    console.error("");
    console.error(
      "✗ Minification process failed:"
    );

    console.error(
      error
    );

    process.exitCode = 1;

  }

}


main();