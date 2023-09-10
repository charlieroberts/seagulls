import { default as seagulls } from '../../seagulls.js'
import { default as Mouse }    from '../../helpers/mouse.js'

/* mouse coordinates
 * 
 * seagulls.js comes with a small set of "helpers" to 
 * assist getting uniforms and buffers up to the GPU.
 * These typically share a unified interface; initialize them
 * and then update their uniform values as needed in onframe.
 * */

const shader = `${seagulls.constants.vertex}

@group(0) @binding(0) var<uniform> mouse : vec3f;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  return vec4f( mouse.x, mouse.y, mouse.z, 1. );
}`

async function main() {
  // initialize seagulls
  const sg = await seagulls.init()

  // initialize Mouse
  Mouse.init()
  
  // set initial mouse values
  sg.uniforms({ mouse:Mouse.values })
    
  // update mouse uniform each frame
  // Mouse.values[0] = x coordinate (between 0-1)
  // Mouse.values[1] = y coorcinate (between 0-1)
  // Mouse.values[2] = left mouse button (either 0 or 1)

  sg.onframe( () => sg.uniforms.mouse = Mouse.values )

  // run the shader
  sg.render( shader ).run()
}

main()
