@group(0) @binding(0) var<uniform> res: vec2f;
@group(0) @binding(1) var<storage, read_write> statein: array<f32>;
@group(0) @binding(2) var<storage, read_write> stateout: array<f32>;

fn index( x:i32, y:i32 ) -> u32 {
  let _res = vec2i(res);
  return u32( (y % _res.y) * _res.x + ( x % _res.x ) );
}

@compute
@workgroup_size(8,8)
fn cs( @builtin(global_invocation_id) _cell:vec3u ) {
  let cell = vec3i(_cell);

  let i = index(cell.x, cell.y);
  let activeNeighbors = statein[ index(cell.x + 1, cell.y + 1) ] +
                        statein[ index(cell.x + 1, cell.y)      ] +
                        statein[ index(cell.x + 1, cell.y - 1) ] +
                        statein[ index(cell.x, cell.y - 1)      ] +
                        statein[ index(cell.x - 1, cell.y - 1) ] +
                        statein[ index(cell.x - 1, cell.y)      ] +
                        statein[ index(cell.x - 1, cell.y + 1) ] +
                        statein[ index(cell.x, cell.y + 1)      ];

  if( activeNeighbors == 2.0 ) {
    stateout[i] = statein[i];
  }else if( activeNeighbors == 3.) {
    stateout[i] = 1.;
  }else{
    stateout[i] = 0.;
  }
}
