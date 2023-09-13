import { default as seagulls } from '../../seagulls.js'

const sg      = await seagulls.init(),
      frag    = await seagulls.import( './frag.wgsl' ),
      compute = await seagulls.import( './compute.wgsl' ),
      render  = seagulls.constants.vertex + frag,
      size    = window.innerWidth * window.innerHeight,
      state   = new Float32Array( size )

for( let i = 0; i < size; i++ ) {
  state[ i ] = Math.random()
}

const workgroup_size = Math.ceil( size / 64 )  

sg.buffers({ state })
  .uniforms({ resolution:[ window.innerWidth, window.innerHeight ] })
  .backbuffer( false )
  .compute( compute, [workgroup_size, 1, 1] )
  .render( render )
  .run()
