# seagulls

[Go see the demo simulations](https://charlieroberts.github.io/seagulls/demos) and then [learn how to use seagulls](https://charlieroberts.github.io/seagulls/howtos).

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
const frame      = sg.uniform( 0 )
const resolution = sg.uniform([ window.innerWidth, window.innerHeight ])

const render = sg.render({
  shader,
  data: [ frame, resolution ],
  onframe() { frame.value++ },
})

sg.run( render )
```

## Use
Seagulls.js is designed to be used without any type of build step required. 
Import the main `seagulls.js` file and any helpers you might want to 
use, and you're ready to go. As it relies on WebGPU, which is only present
in very recent browsers (primarily Chrome/Edge versions from 2023 or higher,
although Firefox Nightly works with most features) seagulls makes no effort
to work in older browsers... but there are already great libraries for
shader programming in older browsers (see Inspiration at the bottom of this
README).

One tricky aspect is the uniform and texture binding. In your shaders, each
uniform / storage buffer / sampler / texture is given a unique index, and 
it's important that you use the same indices in your shader that seagulls
uses on the CPU. Seagulls uses the order of the `data` array to determine these binding
indices.

Most of the howtos include both a minimal version and a "verbose" version that is
heavily explained / commented.

## API

Almost all functionality requires first making an instance of seagulls using a call
to `seagulls.init()`. From there, methods consist of one of three types:

1. Defining `data` to transfer to the GPU
2. Defining shader `passes` (either compute or render)
3. Running a pipeline of shader passes.

### Class methods
- `sg.init()`. An asynchronous method that creates a WebGPU canvas and initializes it.
- `sg.import( filename )`. An asynchrnous method that loads a shader from a serer as a string.

### Data
- `sg.uniform( number | array )`. This method returns a seagulls uniform object that
can be used to create a shader pass.
- `sg.buffer( Float32Array )`. This method returns a seagulls buffer. The buffer will
be transferred to the GPU with whatever underlying values it contains at the time this method is
called. Note that even if you are using a single value, you must still pass a `Float32Array` of length `1`. 
- `sg.texture( TypedArray, textureFormat='brga8uorm' )`. This creates a texture to read from. By default the texture will be the same size as the webgpu canvas.
- `sg.sampler()`. This creates a sampler object for sampling textures in shaders, such as the output of `sg.feedback()`.
- `sg.video()`. This creates a texture using external video elements, such as from a webcam.
- `sg.pingpong( sg.buffer, sg.buffer )`. Many simulations require ping-ponging buffers, so that
a simulation will read from buffer A while writing to buffer B, and then on the next frame
complete this process in reverse. This avoids race conditions where you are reading from the
same data that you are changing.

### Shader passes
- `sg.render( Object )`. The render method returns a shader pass that can be used to form a shader
pipeline. It expects a JS object with the following properties:
  - `shader`: The text of the render shader, including both the vertex and fragment shader.
  - `data` (optional): An array of seagulls `data` objects, as described in the previous section. While this is technically optional, almost all render shaders will use this property in some way.
  - `onframe` (optional): A function that will be executed on the CPU everytime the shader is run. Use this to, for example, update shader uniform values.
  - `copy` (optional): If you pass a texture to this argument, the render output will be copied to it. You can then read the texture in a subsequent render pass (for example, for post-processing) or read from it in the next frame to create feedback effects.
  - `count` (default 1, optional): The number of times this render pass should be run. By default each render pass will run once, but you can use higher counts for [instanced rendering](https://learnopengl.com/Advanced-OpenGL/Instancing); see the [particles howto](https://charlieroberts.github.io/seagulls/howtos/13_many_particles) or the [boids demo](https://charlieroberts.github.io/seagulls/demos/5_boids_basic) for examples. 

- `sg.compute( Object )`. The compute method returns a compute shader pass that can be used to form
a shader pipeline. It expects a JS object with the following properites:
  - `shader`: The text of the render shader, including both the vertex and fragment shader.
  - `data` (optional): An array of seagulls `data` objects, as described in the previous section.
  While this is technically optional, it's impossible for a compute shader to have any effect without
  using this property.
  - `onframe` (optional): A function that will be executed on the CPU everytime the shader is run.
Use this to, for example, update shader uniform values.
  - `dispatch`: A JavaScript array representing the intended dispatch count of the compute shader.

### Run a pipeline
- `sg.run( ...passes )`. Run a series of shader passes indefinitely, where each argument to the function
is a separate shader pass.
- `sg.once( ...passes )`. Run a series of shader passes a single time. 


## Inspiration / Resources
- [gl-toy](http://stack.gl/packages/#stackgl/gl-toy) : A minimal shader setup library for WebGL / GLSL
- [regl](https://github.com/regl-project/regl) : A minimal, stateless, WebGL renderer
- [wgsl-live](https://charlieroberts.github.io/wgsl_live) : A browser-based WGSL live coding environment made using seagulls.js
- [wgsl-workbench](https://github.com/ArthurAmes/wgsl_workbench) : A desktop WGSL live coding environment written in Rust
- [points](https://github.com/Absulit/points)  : Another minimal WebGPU setup library for creative coding
- more to come...



