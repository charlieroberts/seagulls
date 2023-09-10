@group(0) @binding(0) var<uniform> frame : f32;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let value = .5 + sin( frame / 60. ) * .5;

  return vec4f( value, 0., 1.-value, 1. );
}
