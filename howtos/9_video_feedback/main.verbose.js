import { default as seagulls } from '../../seagulls.js'
import { default as Video    } from '../../helpers/video.js'

/* video feedback 
 *
 * This demo uses the live video feed from your webcam
 * and applies feedback to it. For live video, you need
 * to: 
 *
 * 1) load and initialize the appropriate helper 
 * 2) add the necessary variables to your shader
 * 3) add a call to .textures in your JavaScript
 *
 * LIVE VIDEO DOES NOT WORK IN FIREFOX NIGHTLY. You 
 * need Chrome or Edge to run this demo, this will
 * change as Firefox implements WebGPU features that
 * are currently missing.
 *
 */ 

const shader = `${seagulls.constants.vertex}

// the sampler / texture for live video appear
// after all uniforms, storage buffers, and the
// sampler / texture for feedback.
@group(0) @binding(0) var<uniform> resolution: vec2f;
@group(0) @binding(1) var backSampler:    sampler;
@group(0) @binding(2) var backBuffer:     texture_2d<f32>;
@group(0) @binding(3) var videoSampler:   sampler;

// NOTE THAT THERE IS A DIFFERENT GROUP NUMBER FOR THE
// VIDEO TEXTURE BELOW. This lets seagulls easily rebind
// the texture for each frame, without having to rebind
// the other variables in group 0. Given the new group,
// the binding index resets to 0.

@group(1) @binding(0) var videoBuffer:    texture_external;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let p = pos.xy / resolution;

  // WebGPU requires us to use a different function to sample
  // from live video / video files
  let video = textureSampleBaseClampToEdge( videoBuffer, videoSampler, p );

  // read the previous frame of video
  let fb = textureSample( backBuffer, backSampler, p );

  // combine the circle and the feedback
  let out = video * .05 + fb * .975;

  return vec4f( out.rgb, 1. );
}`

// initialize seagulls
const sg = await seagulls.init()

// request video permissions and start streaming
await Video.init()

// get resolution
const resolution = [ window.innerWidth, window.innerHeight ]

sg
  .uniforms({ resolution })
  // ADD CALL TO .textures HERE
  .textures([ Video.element ])
  .render( shader )
  .run()
