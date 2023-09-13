@group(0) @binding(0) var<storage> state: f32;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let v = state;
  return vec4f( v,v,v, 1.);
}
