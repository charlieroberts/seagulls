@group(0) @binding(0) var<storage, read_write> state: array<f32>;

@compute @workgroup_size(64,1)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  state[ cell.x ] = (state[ cell.x ] + .01) % 1.;
}
