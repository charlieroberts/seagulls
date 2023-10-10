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

const state_b = sg.buffer( state ),
      frame_u = sg.uniform( 0 ),
      res_u   = sg.uniform([ sg.width, sg.height ]) 

const render = sg.render({
  shader: render_shader,
  data: [
    frame_u,
    res_u,
    state_b
  ],
  onframe() { frame_u.value++ },
  count: NUM_PARTICLES,
  blend: true
})


const dc = Math.ceil( NUM_PARTICLES / 64 )

const compute = sg.compute({
  shader: compute_shader,
  data:[
    res_u,
    state_b
  ],
  dispatchCount: [ dc, dc, 1 ] 

})

sg.run( compute, render )
