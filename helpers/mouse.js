const Mouse = {
  values: [0,0,0],
  init() {
    window.onmousemove = e => {
      Mouse.values[0] = e.pageX / window.innerWidth
      Mouse.values[1] = e.pageY / window.innerHeight
    }

    document.body.onmousedown = e => Mouse.values[2] = 1
    document.body.onmouseup   = e => Mouse.values[2] = 0
  }
}

export default Mouse
