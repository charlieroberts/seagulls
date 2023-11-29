import { default as seagulls } from '../../seagulls.js'

/* uniforms
* A uniform is how we get information
* from the CPU up to the GPU. In order
* to accomplish this, we need to do three
* things:
*
* - add the uniform to our shader (gpu)
* - create the uniform in javascript (cpu)
* - (optional) update the uniform each frame (cpu->gpu)
*
* for this demo we'll add a frame counter and
* use that to drive animatino in our shader.
*/

// in the shader below, the uniform declaration
// assumes that there is only one uniform. The group
// for uniforms will always be zero (with one exception
// in a later demo). The binding will start with 0 for
// the first uniform passed to sg.uniforms() and increase
// by one for each subsequent uniform.

const shader = `${seagulls.constants.vertex}

@group(0) @binding(0) var<uniform> frame : f32;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let value = .5 + sin( frame / 60. ) * .5;

  return vec4f( value, 0., 1.-value, 1. );
}`

// initialize seagulls
const sg = await seagulls.init()

// create a variable on the CPU to hold our
// frame count
let frame = 0

// call .uniforms and give dictionary of
// key value pairs. The value will specify
// the initial value for the uniform. The
// key will enable us to update the uniform
// later.

sg.uniforms({ frame:0 })

// define an onframe event that updates
// our frame uniform

sg.onframe( ()=> sg.uniforms.frame = frame++ ) 

// run the shader
sg.render( shader ).run()

