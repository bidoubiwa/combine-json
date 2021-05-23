const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const {
  inputFilesAndDir,
  resolveOutputFilePath,
  filterNonJson,
  createOutputArrayFile,
  openFile,
  fileSize,
} = require('./file-utils');
const { jsonRootType, closingArrayIndex } = require('./json-root-type');

const BUFFER_SIZE = 8;

async function combine({ inputFiles, inputDirPath, outputFilePath }) {
  createOutputArrayFile(outputFilePath);
  const numberOfFiles = inputFiles.length;

  for (let index = 0; index < numberOfFiles; index++) {
    let fileName = inputFiles[index];
    let inputFile = `${inputDirPath}${fileName}`;

    const inputFileFd = openFile(inputFile);

    const { isArray, typeIndex, empty } = jsonRootType({
      fd: inputFileFd,
      bufferSize: BUFFER_SIZE,
    });
    let lastBracket = undefined;

    if (true) {
      if (isArray) {
        lastBracket =
          closingArrayIndex({
            inputFile,
            fd: inputFileFd,
            position: fileSize(inputFile) - BUFFER_SIZE,
          }) - 2;
      }
      // open destination file for appending
      var writeStream = fs.createWriteStream(outputFilePath, {
        flags: 'a',
      });

      // open source file for reading
      let startPosition = isArray ? typeIndex + 1 : typeIndex;
      var readStream = fs.createReadStream(inputFile, {
        start: startPosition,
        end: lastBracket,
      });

      readStream.pipe(writeStream);

      await new Promise(function (resolve) {
        writeStream.on('close', function () {
          resolve();
        });
      });

      let last = index === numberOfFiles - 1;

      if (!last && !empty) {
        let coma = path.resolve(__dirname, '../assets/coma');
        let comaWrite = fs.createWriteStream(outputFilePath, {
          flags: 'a',
        });
        let comaRead = fs.createReadStream(coma);
        comaRead.pipe(comaWrite);
        const addComa = new Promise(function (resolve, reject) {
          comaWrite.on('close', function () {
            resolve();
          });
        });
        await addComa;
      } else if (last) {
        let closingBracket = path.resolve(
          __dirname,
          '../assets/closing_bracket'
        );
        let closingBracketWrite = fs.createWriteStream(outputFilePath, {
          flags: 'a',
        });
        let closingBracketRead = fs.createReadStream(closingBracket);
        closingBracketRead.pipe(closingBracketWrite);
        const addclosingBracket = new Promise(function (resolve, reject) {
          closingBracketWrite.on('close', function () {
            resolve();
          });
        });
        await addclosingBracket;
      }

      console.log(
        chalk.green(
          'file: ' +
            chalk.blue.underline.bold(fileName) +
            ` has been added! last : ${last}, index: ${index}, numberOfFiles: ${numberOfFiles}`
        )
      );
    }
  }
  return 1;
}

async function combineJson(inputDir, outputFile = undefined) {
  try {
    const { inputDirPath, filesName } = inputFilesAndDir({ inputDir });
    const outputFilePath = resolveOutputFilePath({ fileName: outputFile });
    const inputFiles = filterNonJson({ filesName });
    return await combine({ inputFiles, inputDirPath, outputFilePath });
  } catch (e) {
    throw e;
  }
}

module.exports = combineJson;
