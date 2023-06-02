const {app,BrowserWindow, ipcMain} = require('electron')
require('dotenv').config({path: __dirname + '/.env'})
const path = require("path")
const fs = require("fs")
const readline = require('readline')
const xlsx = require('xlsx')
const os = require('os');

require('@electron/remote/main').initialize()

let myWindow = null
    
const gotTheLock = app.requestSingleInstanceLock()


function createWindow() {
    //create browser window
    myWindow = new BrowserWindow({
        width: 900,
        height: 650,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        },
        icon:"./sbs logo.ico"
    })
    myWindow.loadURL( `file://${path.join(__dirname, '../build/index.html')}`)
    
}

if(!gotTheLock){
    app.quit()
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, we should focus our window.
        if (myWindow) {
          if (myWindow.isMinimized()) myWindow.restore()
          myWindow.focus()
        }
      })
    
      app.whenReady().then(() => {
        createWindow()
      })
    
      //Quit when windows are closed (for mac)
      //removes common occurence of app staying open until Cmd+Q
      app.on('windows-all-closed', () => {
          if(process.platform !== 'darwin'){
              app.quit()
          }
      })

      ipcMain.handle("path-to-buffer", async(event, ...args) => {
        const [filePath, fastaFilePath] = args

        //helper function to read excel file and get data from excel file and turn it into json
        function readExcelFile(filePath) {
          const workbook = xlsx.readFile(filePath);
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
        
          const excelData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        
          return excelData.slice(1); // Skip header row
        }

        // and gets chromosome, start, end, and transcriptID
        function parseDNASequencesFromExcel(filePath, fastaFilePath) {
          const excelData = readExcelFile(filePath);
        
          const promises = excelData.map((row) => {
            const scaffoldTitle = row[1]; // Column B
            const startIndex = parseInt(row[2]); // Column C
            const endIndex = parseInt(row[3]); // Column D
            const transcriptID = row[7]
            const outputFile = path.join(os.homedir(), 'Downloads', `${row[7]}.txt`); // Column H
        
            return parseDNASequence(fastaFilePath, scaffoldTitle, startIndex, endIndex, outputFile, transcriptID);
          });
        
          return Promise.all(promises);
        }

        //helper function to make lines have 80 character max length
        function wrapSequence(sequence) {
          let wrappedSequence = '';
        
          while (sequence.length > 80) {
            wrappedSequence += sequence.substring(0, 80) + '\n';
            sequence = sequence.substring(80);
          }
        
          wrappedSequence += sequence + '\n';
        
          return wrappedSequence;
        }

        function parseDNASequence(fastaFilePath, scaffoldTitle, startIndex, endIndex, outputFilePath, transcriptID) {
          return new Promise((resolve, reject) => {
            let withinSequence = false;
            let currentSequence = '';
            endIndex--
            let lineStartIndex = 0;
            let lineEndIndex = -1;
        
            const fileStream = fs.createReadStream(fastaFilePath);
            const rl = readline.createInterface({
              input: fileStream,
              crlfDelay: Infinity
            });
        
            rl.on('line', (line) => {
              if (line.startsWith('>')) {
                if (line.includes(scaffoldTitle)) {
                  withinSequence = true;
                  currentSequence = '';
                  lineStartIndex = 0;
                  lineEndIndex = -1;
                } else {
                  withinSequence = false;
                }
              } else if (withinSequence) {
                lineStartIndex = lineEndIndex + 1;
                lineEndIndex = lineStartIndex + line.length - 1;
        
                if (lineEndIndex < startIndex) {
                  // Line is completely outside the desired range
                  lineStartIndex = lineEndIndex + 1;
                  return;
                }
        
                const startWithinLine = Math.max(startIndex - lineStartIndex - 1, 0);
                const endWithinLine = Math.min(endIndex - lineStartIndex, line.length - 1);
        
                if (startWithinLine <= endWithinLine) {
                  const sequenceToAdd = line.substring(startWithinLine, endWithinLine + 1);
                  currentSequence += sequenceToAdd;
                }
              }
            });
        
            rl.on('close', () => {
              const wrappedSequence = wrapSequence(currentSequence);
              fs.writeFileSync(outputFilePath, `>${transcriptID}\n` + wrappedSequence);
              resolve(outputFilePath);
            });
        
            fileStream.on('error', (err) => {
              reject(err);
            });
          });
        }

        return parseDNASequencesFromExcel(filePath, fastaFilePath)
      })
}