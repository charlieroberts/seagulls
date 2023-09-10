import { default as seagulls } from '../../seagulls.js'
import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.1/dist/tweakpane.min.js';

/* tweakpane 
 *
 * tweakpane is a great sytem for making user interfaces,
 * particularly for overlaying over graphics. Learn mroe
 * at https://cocopon.github.io/tweakpane/. In this example
 * we use tweakpane to presnet a color picker for changing
 * the color of a shader.
 */

const shader = `${seagulls.constants.vertex}

@group(0) @binding(0) var<uniform> color : vec3f;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  return vec4f( color, 1. );
}`

// initialize seagulls
const sg = await seagulls.init()

// create a new tweakpane instance
const pane = new Pane()

// create an object with values for 
// tweakpane to control
const params = { color:{ r:0, g:0, b:0 } }

// bind tweakpane to our params object. we need
// to add an extra object specifying type 'float' if
// we want our tweakpane values to range from 0-1 instead
// of 0-255 (which is the default for html / css)
const binding = pane.addBinding( params, 'color', { color: { type:'float' } } )

// register an event for whenever tweakpane
// changes a value
binding.on( 'change', evt => {
  // Object.values() accepts a javascript object
  // (aka dictionary) and extracts the values while
  // ignoring the keys. So, Object.values({ r:0, g:1, b:2 })
  // becomes [0,1,2], which is what we need to update a vec3f
  // on the gpu.
  sg.uniforms.color = Object.values( evt.value )
})

sg
  .uniforms({ color: Object.values( params.color ) })
  .render( shader )
  .run()
