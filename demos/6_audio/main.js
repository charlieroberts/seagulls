import { default as seagulls } from '../../seagulls.js'
import { default as Audio    } from '../../helpers/audio.js'

const sg     = await seagulls.init(),
      frag   = await seagulls.import( './frag.wgsl' ),
      shader = seagulls.constants.vertex + frag

document.body.onclick = e => Audio.start()

sg
  .uniforms({ audio:[0,0,0] })
  .onframe( ()=> sg.uniforms.audio = [Audio.low, Audio.mid, Audio.high] )
  .render( shader )
  .run()
