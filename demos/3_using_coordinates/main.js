import { default as seagulls } from '../../seagulls.js'

const sg     = await seagulls.init(),
      frag   = await seagulls.import( './frag.wgsl' ),
      shader = seagulls.constants.vertex + frag

sg
  .uniforms({ resolution:[window.innerWidth, window.innerHeight] })
  .render( shader )
  .run()
