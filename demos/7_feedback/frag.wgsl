@group(0) @binding(0) var<uniform> resolution  : vec2f;
@group(0) @binding(1) var<uniform> mouse: vec3f;
@group(0) @binding(2) var backSampler:    sampler;
@group(0) @binding(3) var backBuffer:     texture_2d<f32>;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let p = pos.xy / resolution;

  let c = 1.-smoothstep( .0, .025, distance(p, mouse.xy) );

  let fb = textureSample( backBuffer, backSampler, p );

  let out = c + fb.rgb * .975;

  return vec4f( out, 1. );
}
