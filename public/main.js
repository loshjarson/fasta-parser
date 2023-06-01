const {app,BrowserWindow, ipcMain} = require('electron')
const isDev = require('electron-is-dev')
require('dotenv').config({path: __dirname + '/.env'})
const path = require("path")
const fs = require("fs")

require('@electron/remote/main').initialize()

let myWindow = null
    
const gotTheLock = app.requestSingleInstanceLock()


function createWindow() {
    //create browser windownp
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
    myWindow.loadURL( isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`)
    
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
        return fs.readFileSync(args[0])
      })
}