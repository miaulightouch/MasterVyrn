'use strict'

import ConfigHandler from '../../common/ConfigHandler'
import { remote } from 'electron'

class RendererConfig extends ConfigHandler {
  setDefaultConfig () {
    this.defaultConfig = {
      alwaysOnTop: false,
      proxy: 'direct://',
      language: navigator.languages[0] || navigator.language
    }
  }
  readConfig () {
    let config = JSON.parse(window.localStorage.getItem('configure'))
    if (!config) {
      throw new Error(`Can't read config from localStorage!`)
    }
    return config
  }
  saveConfig (obj) {
    window.localStorage.setItem('configure', JSON.stringify(obj))
  }
  configApply () {
    return new Promise((resolve, reject) => {
      remote.getCurrentWindow().setAlwaysOnTop(this.config.alwaysOnTop)
      if (this.initialized) {
        window.vue.$i18n.locale = this.config.language
      }
      this.initialized = true
      resolve()
    })
  }
}

export default () => { return new RendererConfig() }