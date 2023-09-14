import { default as seagulls } from '../../seagulls.js'

/* simplest_compute
 *
 * This demo combines a compute shader and a fragment shader.
 * The compute shader updates a single value, gradually
 * fading it between 0-1. The fragment shader uses that single
 * value to color every pixel.
 *
 * Compute shaders write to "storage" buffers. To make the
 * compute shader work, we need to:
 *
 * 1. Add a call to sg.buffers passing in an initial value
 * for our buffer (this must be a Float32Array).
 * 2. Add the buffer variable to both our compute shader
 * (for reading/writing) and our fragment shader (for reading only)
 * 3. Add a call to sg.compute() to schedule our compute shader
 * to run.
 * 4. We're not using the backbuffer in this example, so we'll
 * turn it off with sg.backbuffer( false ). Storage buffers must
 * be listed after the back buffer / sampler in our fragment shader;
 * but turning the back buffer off means we don't need to include
 * anything related to the back buffer in our shader.
 * 5. We need to specify a workgroup size. This helps determine
 * how many times per frame the compute shader will run. For our
 * purposes, we only want it to run once, so we'll use a workgroup
 * size of (1,1)
 */

const render_shader = `${seagulls.constants.vertex}

// the one f32 that we'll update in our compute shader
// in the fragment shader we'll just read from it
@group(0) @binding(0) var<storage> state: f32;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  return vec4f( state );
}`

const compute_shader =`
// in the compute shader we must mark that we can both
// read from and write to our storage buffer.
@group(0) @binding(0) var<storage, read_write> state:f32;

@compute
// specify the workgroup size
@workgroup_size(1,1)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  // set value to be between 0-1
  state = (state + .01) % 1.;
}
`

const sg = await seagulls.init()

// create a an array to hold our initial state
const state = new Float32Array([ 0 ])

// pass our array to the .buffers() method
sg.buffers({ state })
// turn the back buffer of
  .backbuffer( false )
// schedule the compute shader to run
  .compute( compute_shader )
// schedule the fragment shader to run
  .render( render_shader )
// start running
  .run()
