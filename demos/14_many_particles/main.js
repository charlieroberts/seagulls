import { default as seagulls } from '../../seagulls.js'

const WORKGROUP_SIZE = 8

let frame = 0

const sg = await seagulls.init(),
      render_shader  = await seagulls.import( './render.glsl' ),
      compute_shader = await seagulls.import( './compute.glsl' )

const NUM_PARTICLES = 1024, 
      // must be evenly divisble by 4 to use wgsl structs
      NUM_PROPERTIES = 4, 
      state = new Float32Array( NUM_PARTICLES * NUM_PROPERTIES )

for( let i = 0; i < NUM_PARTICLES * NUM_PROPERTIES; i+= NUM_PROPERTIES ) {
  state[ i ] = -1 + Math.random() * 2
  state[ i + 1 ] = -1 + Math.random() * 2
  state[ i + 2 ] = Math.random() * 10
}

sg.buffers({ state })
  .backbuffer( false )
  .blend( true )
  .uniforms({ frame, res:[sg.width, sg.height ] })
  .compute( compute_shader, NUM_PARTICLES / (WORKGROUP_SIZE*WORKGROUP_SIZE) )
  .render( render_shader )
  .onframe( ()=>  sg.uniforms.frame = frame++  )
  .run( NUM_PARTICLES )

