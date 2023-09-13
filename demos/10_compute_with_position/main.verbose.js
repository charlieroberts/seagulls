import { default as seagulls } from '../../seagulls.js'

/* compute_with_position
 *
 * This demo is very simple to demo 9, but
 * instead of using the compute shader to calculate
 * a single value we use it to calculate a
 * different value for every pixel on the
 * screen.
 */

const render_shader = `${seagulls.constants.vertex}

// resolution of viewport
@group(0) @binding(0) var<uniform> res:   vec2f;

// declare state to be an array of 32-bit floats
@group(0) @binding(1) var<storage> state: array<f32>;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  // we derive the index into our array with the formula
  // row number * width + column number
  let idx : u32 = u32( pos.y * res.x + pos.x );
  let v = state[ idx ];
  return vec4f( v,v,v, 1.);
}`

const compute_shader =`
@group(0) @binding(0) var<uniform> res:   vec2f;

// in the compute shader, the storage buffer must be
// declared as read_write, the default is read-only
@group(0) @binding(1) var<storage, read_write> state: array<f32>;

// here we specify a workgroup size of 64. this
// should always be a power of 8 for optimization on
// nvidia cards.
@compute @workgroup_size(64,1)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  state[ cell.x ] = (state[ cell.x ] + .01) % 1.;
}
`

const sg = await seagulls.init(),
      size = window.innerWidth * window.innerHeight,
      state = new Float32Array( size )

// set state to random starting values
for( let i = 0; i < size; i++ ) {
  state[ i ] = Math.random()
}

const workgroup_count = Math.ceil( size / 64 )  

sg.buffers({ state })
  .uniforms({ resolution:[ window.innerWidth, window.innerHeight ] })
  .backbuffer( false )
  .compute( compute_shader, [workgroup_count, 1, 1] )
  .render( render_shader )
  .run()

