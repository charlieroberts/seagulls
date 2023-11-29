import { default as seagulls } from '../../seagulls.js'
import { default as Mouse }    from '../../helpers/mouse.js'

const sg = await seagulls.init()
      
const back = new Float32Array( seagulls.width * seagulls.height * 4 )

const res_u   = sg.uniform([ sg.width, sg.height ])
const copy_t = sg.texture( back )

const color_shader = seagulls.constants.vertex + `
@group(0) @binding(0) var <uniform> res  : vec2f;
@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let p = pos.xy / res;

  var color:vec3f = vec3f(0.);
  
  if( p.x > .5 ) { color.r = 1.; }
  if( p.y > .5 ) { color.g = 1.; }
  if( length( p - vec2f(.5) ) < .5 ) { color.b = 1.; }

  return vec4f(color, 1.);
}
`
const process_shader = seagulls.constants.vertex + `
@group(0) @binding(0) var <uniform> res  : vec2f;
@group(0) @binding(1) var currentBuffer:  texture_2d<f32>;
@group(0) @binding(2) var currentSampler: sampler;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let p = pos.xy / res;

  let c = textureSample( currentBuffer,  currentSampler, p );
  let o = vec3f( (c.r + c.g + c.b) / 3. );
  return vec4f( o ,1.);
}
`

const render = sg.render({
  shader: color_shader,
  data:[
    res_u,
  ],
  copy:copy_t,
})

const process = sg.render({
  shader: process_shader,
  data:[
    res_u,
    copy_t,
    sg.sampler(),
  ]
})

sg.run( render, process )
