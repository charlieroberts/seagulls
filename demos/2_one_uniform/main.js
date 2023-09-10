import { default as seagulls } from '../../seagulls.js'

const sg     = await seagulls.init(),
      frag   = await seagulls.import( './frag.wgsl' ),
      shader = seagulls.constants.vertex + frag

let frame = 0

sg
  .uniforms({ frame })
  .onframe( ()=> sg.uniforms.frame = frame++ ) 
  .render( shader )
  .run()
