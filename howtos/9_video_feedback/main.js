import { default as seagulls } from '../../seagulls.js'
import { default as Video    } from '../../helpers/video.js'

const sg     = await seagulls.init(),
      frag   = await seagulls.import( './frag.wgsl' ),
      shader = seagulls.constants.vertex + frag

await Video.init()

const back = new Float32Array( seagulls.width * seagulls.height * 4 )
const feedback_t = sg.texture( back ) 

const render = sg.render({
  shader,
  data:[
    sg.uniform([ sg.width, sg.height ]),
    sg.sampler(),
    feedback_t,
    sg.video( Video.element )
  ],
  copy: feedback_t
})

sg.run( render )
