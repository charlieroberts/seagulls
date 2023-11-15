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
uses on the CPU. Seagulls uses the order of the `data` array to determine binding
indices.

Most demos include both a minimal version and a "verbose" version that is
heavily explained / commented.

## Inspiration / Resources
- [gl-toy](http://stack.gl/packages/#stackgl/gl-toy) : A minimal shader setup library for WebGL / GLSL
- [regl](https://github.com/regl-project/regl) : A minimal, stateless, WebGL renderer
- [wgsl-live](https://charlieroberts.github.io/wgsl_live) : A browser-based WGSL live coding environment made using seagulls.js
- [wgsl-workbench](https://github.com/ArthurAmes/wgsl_workbench) : A desktop WGSL live coding environment written in Rust
- [points](https://github.com/Absulit/points)  : Another minimal WebGPU setup library for creative coding
- more to come...



