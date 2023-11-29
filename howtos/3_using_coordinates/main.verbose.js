import { default as seagulls } from '../../seagulls.js'

/* using coordinates
 * For every pixel the fragment shader generates
 * a color for, the vertex shader gives it coordinates
 * in pixels. We can access it inside the pos variable
 * passed to the fragment shader, where pos.x is the x
 * coordinate and pos.y is the y coordinate. However,
 * pixel coordiantes aren't super useful in shaders; it's
 * generally much more useful to obtain coordinates in
 * the range of 0-1 or -1 to 1. 
 *
 * To do this we need to add a uniform to our shader
 * that tells the GPU the resolution of our canvas. If
 * we divide our pixel coordinates by this number, we'll
 * get our desired coordinates in the 0-1 range.
*/

// in our shader below we add a uniform for our
// resolution, and use this to calculate normalized
// coordinates.
//
const shader = `${seagulls.constants.vertex}

@group(0) @binding(0) var<uniform> resolution : vec2f;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let p = pos.xy / resolution;

  return vec4f( p.x, p.y, 0., 1. );
}`

async function main() {
  // initialize seagulls
  const sg = await seagulls.init()
  
  // window.innerWidth and window.innerHeight
  // will give our resolution
  sg.uniforms({ resolution:[window.innerWidth, window.innerHeight] })

  // run the shader
  sg.render( shader ).run()
}

main()
