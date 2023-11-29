@group(0) @binding(0) var<uniform> resolution : vec2f;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let p = pos.xy / resolution;

  return vec4f( p.x, p.y, 0., 1. );
}
