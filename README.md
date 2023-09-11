# seagulls

Seagulls is a small framework for minimal WebGPU setup, particularly targeting
fullscreen fragment + compute shaders for GPU-accelerated simulations. It also
provides a number of small helpers to manage audio analysis, video input, mouse
input, and sending other data to the GPU. It looks like this:

```js
import { default as seagulls } from './seagulls.js'

const shader = `${seagulls.constants.vertex}

@group(0) @binding(0) var <uniform> frame : f32;
@group(0) @binding(1) var <uniform> resolution : vec2f;

@fragment
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let uv = pos.xy / resolution;
  let time = frame / 60.;
  return vec4f( uv.x, uv.y, time % 1., 1. );
}`

const sg         = await seagulls.init()
const resolution = [ window.innerWidth, window.innerHeight ]
let frame = 0

sg
  .uniforms({ frame, resolution })
  .onframe( ()=> sg.uniforms.frame = frame++ ) 
  .render( shader )
  .run()
```

## Use
Seagulls.js is designed to be used without any type of build step required. 
Just import the main `seagulls.js` file and any helpers you might want to 
use, and you're ready to go. As it relies on WebGPU, which is only present
in very recent browsers (really, Chrome/Edge versions from 2023 or higher,
although Firefox Nightly works with most features) seagulls makes no effort
to work in older browsers... but there are already great libraries for
shader programming in older browsers (see Inspiration at the bottom of this
README).

One tricky aspect is the uniform and texture binding. In your shaders, each
uniform / storage buffer / sampler / texture is given a unique index, and 
it's important that you use the same indices in your shader that seagulls
uses on the CPU. Seagulls places all the uniforms first starting at index 
0 in the order you define them when you call `sg.uniforms()`,
then places storage buffers (if needed), and finally places textures (if
needed). Textures and their associated samplers will alternate (TODO more
info on this after appropriate examples are added).

Most demos include both a minimal version and a "verbose" version that is
heavily explained / commented.

## Reference
For this reference, `seagulls` refers to the main module that you import,
while `sg` refers to an instance create by a call to `seagulls.init()`. 
See the various demos in the `/demos` folder for more examples of how to use
the library.

`seagulls.init()` - An async method that creates a new seagulls instance.

`sg.uniforms( dictionary:Object )` - This function creates a manager for uniforms
(data shared between the CPU and GPU). Pass in key/value pairs to create 
uniforms and assign them their initial values. Once this function has been
called, you can then change the value of a uniform through member variables
that are created on the function itself. So, after calling `sg.uniforms({ frame:0 })`
you can then update the `frame` uniform on the GPU by calling `sg.uniforms.frame = 20`. 
Note that there is currently a bunch of meta-programming to make this work that stops
operators like `++` and `+=` from working correctly... just use simple assignment.

`sg.buffers( dictionary:Object )` A key / value list of buffers, where each buffer is
a `Float32Array` filled with data to be passed to the GPU. These buffers can be read
and written to inside of compute shaders; vertex and fragment shaders cna only read
from them.

`sg.onframe( callback:Function )` - Assigns an event handler that will be called on 
for every frame of animation.

`render( shader:String )` - Pass a vertex / fragment shader to this function to create a render pipeline.

`compute( shader:String )` - Pass a compute shader to this function to create a compute pipeline.

`run()` - Start the animation loop and the shader running.

## Inspiration / Resources
- [gl-toy](http://stack.gl/packages/#stackgl/gl-toy) : A minimal shader setup library for WebGL / GLSL
- [regl](https://github.com/regl-project/regl) : A minimal, stateless, WebGL renderer
- [wgsl-live](https://charlieroberts.github.io/wgsl_live) : A browser-based WGSL live coding environment made using seagulls.js
- [wgsl-workbench](https://github.com/ArthurAmes/wgsl_workbench) : A desktop WGSL live coding environment written in Rust
- [points](https://github.com/Absulit/points)  : Another minimal WebGPU setup library for creative coding
- more to come...



