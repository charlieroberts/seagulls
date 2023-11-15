@group(0) @binding(0) var<uniform> frame: f32;
@group(0) @binding(1) var<uniform> res:   vec2f;
@group(0) @binding(2) var<storage> state: array<f32>;

@vertex 
fn vs( @location(0) input : vec2f ) ->  @builtin(position) vec4f {
  let size   = input * .05;
  let aspect = res.y / res.x;
  return vec4f( state[0] - size.x * aspect, state[1] + size.y, 0., 1.); 
}

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {;
  let blue = .5 + sin( frame / 60. ) * .5;
  return vec4f( pos.x / res.x, pos.y / res.y, blue , 1. );
}
