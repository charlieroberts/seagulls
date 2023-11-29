import { default as seagulls } from '../../seagulls.js'
import { default as Mouse    } from '../../helpers/mouse.js'

/* feedback 
 *
 * For feedback we need to save each frame of video
 * into a separate texture that we can then read from
 * inside of our shader. seagulls.js handles this
 * automatically; all you need to do is include the bindings
 * for the texture and its sampler (a configurable way to
 * read from the texture) at the end of all your shader
 * uniforms... just start the indices at wherever your
 * uniforms left off.
 *
 */ 

const shader = `${seagulls.constants.vertex}

@group(0) @binding(0) var<uniform> resolution  : vec2f;
@group(0) @binding(1) var<uniform> mouse: vec3f;
@group(0) @binding(2) var backSampler:    sampler;
@group(0) @binding(3) var backBuffer:     texture_2d<f32>;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let p = pos.xy / resolution;

  // create a circle using the current mouse position
  let c = 1.-smoothstep( .0, .025, distance(p, mouse.xy) );

  // read the previous frame of video
  let fb = textureSample( backBuffer, backSampler, p );

  // combine the circle and the feedback
  let out = c + fb.rgb * .975;

  return vec4f( out, 1. );
}`

// initialize seagulls
const sg = await seagulls.init()

// start mouse tracking
Mouse.init()

// get resolution
const resolution = [ window.innerWidth, window.innerHeight ]

sg
  .uniforms({ resolution, mouse:Mouse.values })
  .onframe( ()=> sg.uniforms.mouse = Mouse.values ) 
  .render( shader )
  .run()
