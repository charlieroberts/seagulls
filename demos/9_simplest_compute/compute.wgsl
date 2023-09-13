@group(0) @binding(0) var<storage, read_write> state:f32;

@compute @workgroup_size(1,1)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  state = (state + .01) % 1.;
}
