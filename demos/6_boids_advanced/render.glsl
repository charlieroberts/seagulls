struct VertexInput {
  @location(0) pos: vec2f,
  @builtin(instance_index) instance: u32,
};
struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) @interpolate(flat) instance: u32,
};

struct Particle {
  pos: vec2f,
  vel: vec2f,
  color: vec3f
};

@group(0) @binding(0) var<uniform> res:   vec2f;
@group(0) @binding(1) var<storage> state: array<Particle>;

fn rotate(p:vec2f, a:f32) -> vec2f {
  let s = sin(a);
  let c = cos(a);
  let m = mat2x2(c, s, -s, c);
  return m * p;
}

@vertex 
fn vs( input: VertexInput ) ->  VertexOutput {
  let v = state[ input.instance ];
  let p1 = input.pos * .02;
  // only three vertices so who cares I guess?
  let a = atan2(v.vel.x, v.vel.y);
  let p = rotate(p1, a);
  let aspect = (res.y / res.x);
  
  var vsOutput: VertexOutput;
  vsOutput.pos = vec4f( v.pos.x - p.x * aspect, v.pos.y + p.y, 0., 1.);
  vsOutput.instance = input.instance; 
  return vsOutput; 
}

@fragment 
/*fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {;*/
fn fs( input: VertexOutput ) -> @location(0) vec4f {;
  let blue = 0.;

  let v = state[ input.instance ];
  //let fb = textureSample( feedback, feedback_sampler, p );

  //let out = c + fb.rgb * .975;
  return vec4f(v.color,.5);
}
