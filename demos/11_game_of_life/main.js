import { default as seagulls } from '../../seagulls.js'

const sg      = await seagulls.init(),
      frag    = await seagulls.import( './frag.wgsl' ),
      compute = await seagulls.import( './compute.wgsl' ),
      render  = seagulls.constants.vertex + frag,
      size    = (window.innerWidth * window.innerHeight),
      state   = new Float32Array( size )

for( let i = 0; i < size; i++ ) {
  state[ i ] = Math.round( Math.random() )
}

sg.buffers({ stateA:state, stateB:state })
  .uniforms({ resolution:[ window.innerWidth, window.innerHeight ] })
  .backbuffer( false )
  .pingpong( 1 )
  .compute( 
    compute, 
    [Math.round(window.innerWidth / 8), Math.round(window.innerHeight/8), 1], 
    { pingpong:['stateA'] } 
  )
  .render( render )
  .run()
