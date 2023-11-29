import { default as seagulls } from '../../seagulls.js'
import { default as Mouse }    from '../../helpers/mouse.js'

const sg = await seagulls.init()

Mouse.init()
      
const back = new Float32Array( seagulls.width * seagulls.height * 4 )

const res_u   = sg.uniform([ sg.width, sg.height ])
const copy_t = sg.texture( back )

// checkerboard
const color_shader = seagulls.constants.vertex + `
@group(0) @binding(0) var <uniform> res  : vec2f;
@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  var uv:vec2f = fract(pos.xy / res * 4.5);
  uv -= .5;
  
  return vec4f( vec3f(step(uv.x * uv.y, 0.)), 1.);
}
`
// two-pass gaussian blur
// modified / adapted from https://github.com/mattdesl/lwjgl-basics/wiki/ShaderLesson5
const process_shader = seagulls.constants.vertex + `
@group(0) @binding(0) var <uniform> res  : vec2f;
@group(0) @binding(1) var <uniform> dir  : vec2f;
@group(0) @binding(2) var <uniform> mouse: vec3f;
@group(0) @binding(3) var tex: texture_2d<f32>;
@group(0) @binding(4) var smp: sampler;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  var sum:vec4f = vec4f(0.);
  let tc = pos.xy / res;
  let blur = (mouse.xy*dir)/res;

  sum += textureSample( tex, smp, tc - 4. * blur ) * 0.0162162162;
	sum += textureSample( tex, smp, tc - 3. * blur ) * 0.0540540541;
	sum += textureSample( tex, smp, tc - 2. * blur ) * 0.1216216216;
	sum += textureSample( tex, smp, tc - 1. * blur ) * 0.1945945946;
	
	sum += textureSample( tex, smp, tc ) * 0.2270270270;
	
	sum += textureSample( tex, smp, tc + 4. * blur ) * 0.0162162162;
	sum += textureSample( tex, smp, tc + 3. * blur ) * 0.0540540541;
	sum += textureSample( tex, smp, tc + 2. * blur ) * 0.1216216216;
	sum += textureSample( tex, smp, tc + 1. * blur ) * 0.1945945946;

  return vec4f( sum.rgb, 1.);
}
`

const render = sg.render({
  shader: color_shader,
  data:[
    res_u,
  ],
  copy:copy_t,
})

const blurMax = 16
const mouse_u = sg.uniform( Mouse.values )

// blur on X axis
// make sure to copy this pass to texture
const processX = sg.render({
  shader: process_shader,
  data:[
    res_u,
    sg.uniform([ blurMax, 0 ]),
    mouse_u,
    copy_t,
    sg.sampler()
  ],
  copy: copy_t
})

// blur on y axis
// no need for copy as this pass
// is final and rendered to screen
const processY = sg.render({
  shader: process_shader,
  data:[
    res_u,
    sg.uniform([ 0, blurMax ]),
    mouse_u,
    copy_t,
    sg.sampler()
  ],
  onframe() { mouse_u.value = Mouse.values }
})

sg.run( render, processX, processY )
