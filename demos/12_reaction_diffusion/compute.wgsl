@group(0) @binding(0) var<uniform> res: vec2f;
@group(0) @binding(1) var<uniform> coeffs : vec4f;
@group(0) @binding(2) var<storage> statein: array<f32>;
@group(0) @binding(3) var<storage, read_write> stateout: array<f32>;

fn index( cell:vec2u ) -> u32 {
  return (cell.y * u32(res.x) + cell.x - u32(res.x) / u32(2) ) * u32(2);
}

fn getState( x:u32, y:u32 ) -> vec2f {
  let idx = index( vec2u( x,y ) );
  return vec2f( statein[ idx ], statein[ idx + 1u ] );
}

@compute
@workgroup_size(8,8,1)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  let f=coeffs[0]; // + cos(frame/120.) * f32(cell.x) / res.x * .0125;
  let k=coeffs[1]; // + sin(frame/60.) * .0025;
  let dA=coeffs[2];
  let dB=coeffs[3];

  let idx = index(cell.xy);// * u32(2);
  let x = cell.x;
  let y = cell.y;
  var state : vec2f = getState( cell.x, cell.y );
  
  var a = state.x;
  var b = state.y;

  state *= -1.;
  state += getState(x - u32(1), y) * 0.2;
  state += getState(x - u32(1), y-u32(1)) * 0.05;
  state += getState(x, y-u32(1)) * 0.2;
  state += getState(x + u32(1), y-u32(1)) * 0.05;
  state += getState(x + u32(1), y) * 0.2;
  state += getState(x + u32(1), y+u32(1)) * 0.05;
  state += getState(x, y+u32(1)) * 0.2;
  state += getState(x - u32(1), y+u32(1)) * 0.05;

  state.r = a + dA * state.r - a * b * b + f * (1.-a);
  state.g = b + dB * state.g + a * b * b - ((k+f) * b);

  stateout[ idx ] = state.r;
  stateout[ idx+1u ] = state.g;
}
