(() => {
  'use strict'
  // dump getClientRects() value due to it can't be send via ipc message
  const getClientRects = (element) => {
    let {top, left, width, height} = element.getClientRects()[0]
    let rect = {top, left, width, height}
    for (let rule in rect) {
      rect[rule] += 'px'
    }
    return rect
  }

  return new Promise(resolve => {
    let resizeBtn = document.getElementsByClassName('btn-pc-footer-setting')
    let msg = []
    for (let btn of resizeBtn) {
      msg.push({
        id: btn.dataset.size,
        data: btn.dataset,
        preset: 'resizer',
        style: getClientRects(btn),
        clickable: true
      })
    }
    resolve(msg)
  }).then(result => {
    return result
  })
})()