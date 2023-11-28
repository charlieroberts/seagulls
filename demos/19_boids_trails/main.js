import { default as seagulls } from '../../seagulls.js'
import { default as Mouse }    from '../../helpers/mouse.js'

const WORKGROUP_SIZE = 8

const sg = await seagulls.init(),
      render_shader  = await seagulls.import( './render.glsl' ),
      compute_shader = await seagulls.import( './compute.glsl' )
      
const NUM_PARTICLES = 3072, 
      NUM_PROPERTIES = 8, 
      state = new Float32Array( NUM_PARTICLES * NUM_PROPERTIES )

for( let i = 0; i < NUM_PARTICLES * NUM_PROPERTIES; i+= NUM_PROPERTIES ) {
  state[ i     ] = -1 + Math.random() * 2
  state[ i + 1 ] = -1 + Math.random() * 2
  state[ i + 2 ] = -3 + Math.random() * 6
  state[ i + 3 ] = -3 + Math.random() * 6
  state[ i + 4 ] = Math.random()
  state[ i + 5 ] = Math.random()
  state[ i + 6 ] = Math.random()
}

const back = new Float32Array( seagulls.width * seagulls.height * 4 )

Mouse.init()

const state_b = sg.buffer( state )
const res_u   = sg.uniform([ sg.width, sg.height ])
const mouse_u = sg.uniform( Mouse.values )
const sampler_s  = sg.sampler()
const offscreen_t = sg.texture( back )

const render = sg.render({
  shader: render_shader,
  data:[
    res_u,
    state_b
  ],
  blend:true,
  copy:offscreen_t,
  count:NUM_PARTICLES,
  vertices:seagulls.constants.shapes.triangle
})

const compute = sg.compute({
  shader: compute_shader,
  data:[
    res_u,
    state_b,
    mouse_u
  ],
  dispatchCount:NUM_PARTICLES / (WORKGROUP_SIZE * WORKGROUP_SIZE),
  onframe() { mouse_u.value = Mouse.values }
})

const render_shader2 = seagulls.constants.vertex + `
@group(0) @binding(0) var <uniform> res  : vec2f;
@group(0) @binding(1) var currentBuffer:  texture_2d<f32>;
@group(0) @binding(2) var currentSampler: sampler;
@group(0) @binding(3) var feedbackBuffer: texture_2d<f32>;
@group(0) @binding(4) var <uniform> mouse: vec3f;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let p = pos.xy / res;

  let c =  textureSample( currentBuffer,  currentSampler, p );
  let fb = textureSample( feedbackBuffer, currentSampler, p );

  let out = c.rgb * .25 + fb.rgb * .999;

  return vec4f(out.rgb, .9);
}
`
const feedback_t = sg.texture( back )//sg.feedback() 
const render2 = sg.render({
  shader: render_shader2,
  blend:true,
  data:[
    res_u,
    offscreen_t,
    sampler_s,
    feedback_t,
    mouse_u
  ],
  copy: feedback_t
})

sg.run( compute, render, render2 )
