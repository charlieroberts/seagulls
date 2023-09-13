import { default as seagulls } from '../../seagulls.js'

const sg      = await seagulls.init(),
      frag    = await seagulls.import( './frag.wgsl' ),
      compute = await seagulls.import( './compute.wgsl' ),
      render  = seagulls.constants.vertex + frag,
      state   = new Float32Array([ 0 ])

sg.buffers({ state })
  .backbuffer( false )
  .compute( compute )
  .render( render )
  .run()
