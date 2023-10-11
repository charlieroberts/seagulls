import { default as seagulls } from '../../seagulls.js'

const WORKGROUP_SIZE = 8

const sg = await seagulls.init(),
      render_shader  = await seagulls.import( './render.glsl' ),
      compute_shader = await seagulls.import( './compute.glsl' )

const NUM_PARTICLES = 1024, 
      // must be evenly divisble by 4 to use wgsl structs
      NUM_PROPERTIES = 4, 
      state = new Float32Array( NUM_PARTICLES * NUM_PROPERTIES )

for( let i = 0; i < NUM_PARTICLES * NUM_PROPERTIES; i+= NUM_PROPERTIES ) {
  state[ i     ] = -1 + Math.random() * 2
  state[ i + 1 ] = -1 + Math.random() * 2
  state[ i + 2 ] = -3 + Math.random() * 6
  state[ i + 3 ] = -3 + Math.random() * 6
}

const vertices  = new Float32Array([
  0,1,
  -.5,-1.,
  .5,-1.
])

const state_b = sg.buffer( state )
const res_u   = sg.uniform([ sg.width, sg.height ])

const render = sg.render({
  shader: render_shader,
  data:[
    res_u,
    state_b
  ],
  blend:true,
  count:NUM_PARTICLES,
  vertices
})

const compute = sg.compute({
  shader: compute_shader,
  data:[
    res_u,
    state_b,
  ],
  dispatchCount:NUM_PARTICLES / (WORKGROUP_SIZE * WORKGROUP_SIZE)
})

sg.run( compute, render )
