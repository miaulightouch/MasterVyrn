'use strict'

import { app, BrowserWindow, ipcMain, webContents, session } from 'electron'
import path from 'path'
import { DEV, err, log } from '../common/utils'
import './libs/store'
import './libs/deprecated'
import './libs/jsonStorage'

log('App start!')

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

/**
 * Init app
 */
app.isReady()
  ? createWindow()
  : app.on('ready', createWindow)
app.once('ready', () => log('App ready!'))

/**
 * Window section
 */
let mainWindow
let windowSize = {
  min: 320,
  max: 640,
  width: 480,
  autoResize: false
}

const winURL = DEV
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})
if (isSecondInstance) {
  app.quit()
}

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

function createWindow () {
  /**
   * Session setup
   */
  session.defaultSession.setUserAgent(
    session.defaultSession.getUserAgent()
      .replace(new RegExp(`(Electron|${require('../../package.json').name})\\/[\\d.]+\\s`, 'g'), '')
  )

  mainWindow = new BrowserWindow({
    width: 480,
    height: global.jsonStorage.height || 870,
    useContentSize: true,
    fullscreenable: false,
    maximizable: false
  })

  if (global.jsonStorage.x >= 0 && global.jsonStorage.y >= 0) {
    mainWindow.setPosition(global.jsonStorage.x, global.jsonStorage.y)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.loadURL(winURL)

  /**
   * Resize depend on windowSize object
   */
  let delayResize = null
  mainWindow.on('resize', event => {
    clearInterval(delayResize)
    delayResize = setInterval(() => {
      const [winWidth, winHeight] = mainWindow.getSize()
      if (windowSize.autoResize) {
        // limit the minimum window width
        if (winWidth < windowSize.min) {
          mainWindow.setSize(windowSize.min, winHeight)
        }
        // limit the maximum window width
        if (winWidth > windowSize.max) {
          mainWindow.setSize(windowSize.max, winHeight)
        }
      } else {
        mainWindow.setSize(windowSize.width, winHeight)
      }
      clearInterval(delayResize)
    })
  })

  ipcMain.on('ChangeWindowSize', (event, obj) => {
    windowSize = obj
  })

  /**
   * Remember window position and height
   */

  mainWindow.on('move', () => {
    const [x, y] = mainWindow.getPosition()
    Object.assign(global.jsonStorage, { x, y })
  })
  mainWindow.on('resize', () => {
    global.jsonStorage.height = mainWindow.getSize()[1]
  })
}

/**
 * Prevent outside browsing
 */

let preload
const contentPair = {}
const strictUrl = 'http://game.granbluefantasy.jp'

app.on('web-contents-created', (event, contents) => {
  if (contents.getType() === 'window') {
    contents.on('will-attach-webview', (event, webPreferences) => {
      preload = webPreferences.preloadURL.replace(/file:\/\/\/?/, '')
    })
  }
  if (contents.getType() === 'webview') {
    contents.on('will-navigate', (event, url) => {
      if (url.indexOf(strictUrl) === -1) {
        event.preventDefault()
        const win = new BrowserWindow({
          width: 1280,
          height: 1024,
          webPreferences: {
            parent: BrowserWindow.fromWebContents(contents),
            preload,
            nodeIntegration: false
          }
        })
        contentPair[win.webContents.id] = contents.id
        win.once('ready-to-show', () => win.show())
        win.webContents.on('new-window', (event, url) => {
          event.preventDefault()
          if (url.indexOf(strictUrl) !== -1) {
            contents.loadURL(url)
            win.close()
          } else {
            win.loadURL(url)
          }
        })
        win.loadURL(url)
        event.newGuest = win
      }
    })
  }
})

ipcMain.on('webviewRefresh', (event, url) => {
  url
    ? webContents.fromId(contentPair[event.sender.id]).loadURL(url)
    : webContents.fromId(contentPair[event.sender.id]).reload()
  delete contentPair[event.sender.id]
})

/**
 * Handle common error
 */
if (DEV) {
  process.on('unhandledRejection', err)
  process.on('uncaughtException', err)
}

/**
 * Auto Updater
 *
 * Un-comment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (!DEV) autoUpdater.checkForUpdates()
})
 */
