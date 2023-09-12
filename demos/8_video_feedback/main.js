import { default as seagulls } from '../../seagulls.js'
import { default as Video    } from '../../helpers/video.js'

const sg     = await seagulls.init(),
      frag   = await seagulls.import( './frag.wgsl' ),
      shader = seagulls.constants.vertex + frag

await Video.init()

const resolution = [ window.innerWidth, window.innerHeight ]

sg
  .uniforms({ resolution })
  .textures([ Video.element ])
  .render( shader )
  .run()
