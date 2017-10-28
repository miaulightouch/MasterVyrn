// FIXME
'use strict'

;(() => {
  devtronDeps()
  var oldconsolelog = window.console.log
  var oldconsoleerr = window.console.error
  var oldconsolewarn = window.console.warn
  eventInjector()
  window.addEventListener('DOMContentLoaded', () => {
    consoleRecover()
    windowResizer()
    // windowResizeInject()
  })

  /**
   * Devtron deps injector
   */
  function devtronDeps () {
    if (process.env.NODE_ENV === 'development') {
      window.__devtron = {require: require, process: process}
    }
  }

  /**
   * Inject addEventListener to clear mute event
   */
  function eventInjector () {
    let _addEventListener = window.addEventListener
    window.addEventListener = function (a, b, c) {
      let func = b.toString()
      let blockReg = /mute/
      let whiteReg = /unmute/
      if (process.env.NODE_ENV === 'development') {
        if (!whiteReg.test(func)) {
          if (blockReg.test(b.toString())) {
            if (!this.eventListenerBlockedList) this.eventListenerBlockedList = {}
            if (!this.eventListenerBlockedList[a]) this.eventListenerBlockedList[a] = []
            this.eventListenerBlockedList[a].push(b)
            return
          }
        }
      }
      _addEventListener(a, b, c)
    }
  }

  /**
   * Take back the console.log
   */
  function consoleRecover () {
    if (process.env.NODE_ENV === 'development') {
      window.console.log = oldconsolelog
      window.console.error = oldconsoleerr
      window.console.warn = oldconsolewarn
    }
  }

  /**
   * override window resizer
   */
  function windowResizer () {
    window.onresize = () => {
      document.getElementById(window.Game.gameContainer.id).style.zoom = window.displayInitialize()
    }
  }

  /**
   * Make size button can change window size
   * FIXME: NOT IMPLEMENT
   */
  function windowControllInject () {
    let resizeBtn = document.getElementsByClassName('btn-pc-footer-setting')
    for (let index in resizeBtn) {
      if (resizeBtn.hasOwnProperty(index)) {
        resizeBtn[index].addEventListener('click', (evt) => {
          window.alert('Zoom:' + (evt.target.dataset.size * 0.5 + 1) * 320)
        })
      }
    }
  }
})()
