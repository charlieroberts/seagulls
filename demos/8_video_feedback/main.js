import { default as seagulls } from '../../seagulls.js'
import { default as Video    } from '../../helpers/video.js'

const sg     = await seagulls.init(),
      frag   = await seagulls.import( './frag.wgsl' ),
      shader = seagulls.constants.vertex + frag

await Video.init()

const render = sg.render({
  shader,
  data:[
    sg.uniform([ sg.width, sg.height ]),
    sg.sampler(),
    sg.feedback(),
    sg.video( Video.element )
  ]
})

sg.run( render )
