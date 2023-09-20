import { default as seagulls } from '../../seagulls.js'

const WORKGROUP_SIZE = 1

const render_shader = `
@group(0) @binding(0) var<uniform> frame: f32;
@group(0) @binding(1) var<uniform> res:   vec2f;
@group(0) @binding(2) var<storage> state: array<f32>;

@vertex 
fn vs( @location(0) input : vec2f ) ->  @builtin(position) vec4f {
  let size   = input * .05;
  let aspect = res.y / res.x;
  return vec4f( state[0] - size.x * aspect, state[0] + size.y, 0., 1.); 
}

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {;
  let blue = .5 + sin( frame / 60. ) * .5;
  return vec4f( pos.x / res.x, pos.y / res.y, blue , 1. );
}`

const compute_shader =`
@group(0) @binding(0) var<uniform> frame: f32;
@group(0) @binding(1) var<uniform> res:   vec2f;
@group(0) @binding(2) var<storage, read_write> state: vec2f;

@compute
@workgroup_size(1,1)

fn cs( @builtin(global_invocation_id) cell:vec3u)  {
  var next = state + (2. / res) * 4.;
  if( next.x > 1. ) { next -= 2.; }
  state = next;
}
`

let frame = 0

const sg = await seagulls.init()

const initState = new Float32Array([ -1, -1 ])

sg.buffers({state: initState })
  .backbuffer( false )
  .uniforms({ frame, res:[sg.width, sg.height] })
  .compute( compute_shader, 1 )
  .render( render_shader )
  .onframe( ()=> { sg.uniforms.frame = frame++  })
  .run()
