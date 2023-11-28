@group(0) @binding(0) var<uniform> res: vec2f;
@group(0) @binding(1) var<storage> cellState: array<f32>;

@fragment 
fn fs( @builtin(position) input : vec4f ) -> @location(0) vec4f {

  let idx: u32 = u32( input.y * res.x + input.x - res.x * .5 ) * 2u;
  let b = cellState[ idx+1u ];

  let light_dir = vec2f(2.,2.);
  let light_idx = u32( (input.y + light_dir.y) * res.x + ((input.x + light_dir.x) - res.x * .5 ) ) * 2u;
  var light:f32 = 0.;

  let b1 = cellState[ light_idx + 1u ]; 
  if( b1 > .2 ) { light = (b1 - .2)*5.; }

  return vec4f( vec3f(.8 - b) + light, 1. );
}
