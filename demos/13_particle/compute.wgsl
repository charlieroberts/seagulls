@group(0) @binding(0) var<uniform> res:   vec2f;
@group(0) @binding(1) var<storage, read_write> state: vec2f;

@compute
@workgroup_size(1,1)

fn cs( @builtin(global_invocation_id) cell:vec3u)  {
  var next = state + (2. / res);
  if( next.x > 1. ) { next -= 2.; }
  state = next; //vec2f(.5);
}
