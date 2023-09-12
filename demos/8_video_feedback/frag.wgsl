@group(0) @binding(0) var<uniform> resolution: vec2f;
@group(0) @binding(1) var backSampler:    sampler;
@group(0) @binding(2) var backBuffer:     texture_2d<f32>;
@group(0) @binding(3) var videoSampler:   sampler;
@group(1) @binding(0) var videoBuffer:    texture_external;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let p = pos.xy / resolution;

  let video = textureSampleBaseClampToEdge( videoBuffer, videoSampler, p );

  let fb = textureSample( backBuffer, backSampler, p );

  let out = video * .05 + fb * .975;

  return vec4f( out.rgb, 1. );
}

