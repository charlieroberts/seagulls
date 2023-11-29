@group(0) @binding(0) var<storage> state: f32;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  return vec4f( state );
}
