@group(0) @binding(0) var<uniform> audio : vec3f;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  return vec4f( audio, 1. );
}
