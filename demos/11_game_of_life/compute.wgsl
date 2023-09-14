@group(0) @binding(0) var<uniform> res: vec2f;
@group(0) @binding(1) var<storage, read_write> statein: array<f32>;
@group(0) @binding(2) var<storage, read_write> stateout: array<f32>;

fn index( x:u32, y:u32 ) -> u32 {
  return y * u32(res.x) + x;
}

@compute
@workgroup_size(8,8)

fn cs(
  @builtin(global_invocation_id) cell:vec3u
)  {
  let i = index(cell.x, cell.y);
  let activeNeighbors = statein[ index(cell.x + 1u, cell.y + 1u) ] +
                        statein[ index(cell.x + 1u, cell.y)      ] +
                        statein[ index(cell.x + 1u, cell.y - 1u) ] +
                        statein[ index(cell.x, cell.y - 1u)      ] +
                        statein[ index(cell.x - 1u, cell.y - 1u) ] +
                        statein[ index(cell.x - 1u, cell.y)      ] +
                        statein[ index(cell.x - 1u, cell.y + 1u) ] +
                        statein[ index(cell.x, cell.y + 1u)      ];

  if( activeNeighbors == 2.0 ) {
    stateout[i] = statein[i];
  }else if( activeNeighbors == 3.) {
    stateout[i] = 1.;
  }else{
    stateout[i] = 0.;
  }
}
