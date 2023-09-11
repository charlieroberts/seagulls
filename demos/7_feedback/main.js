import { default as seagulls } from '../../seagulls.js'
import { default as Mouse    } from '../../helpers/mouse.js'

const sg     = await seagulls.init(),
      frag   = await seagulls.import( './frag.wgsl' ),
      shader = seagulls.constants.vertex + frag

Mouse.init()

const resolution = [ window.innerWidth, window.innerHeight ]

sg
  .uniforms({ resolution, mouse:[0,0,0] })
  .onframe( ()=> sg.uniforms.mouse = Mouse.values )
  .render( shader )
  .run()
