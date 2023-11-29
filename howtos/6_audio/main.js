import { default as seagulls } from '../../seagulls.js'
import { default as Audio    } from '../../helpers/audio.js'

const sg     = await seagulls.init(),
      frag   = await seagulls.import( './frag.wgsl' ),
      shader = seagulls.constants.vertex + frag

document.body.onclick = e => Audio.start()

const fft = sg.uniform( [0,0,0] )

const render = sg.render({
  shader,
  data: [ fft ],
  onframe() { fft.value = [Audio.low, Audio.mid, Audio.high] }
})

sg.run( render )
