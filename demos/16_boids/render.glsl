struct VertexInput {
  @location(0) pos: vec2f,
  @builtin(instance_index) instance: u32,
};

struct Particle {
  pos: vec2f,
  vel: vec2f
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
fn vs( input: VertexInput ) ->  @builtin(position) vec4f {
  let v = state[ input.instance ];
  let p1 = input.pos * .035;
  // only three vertices so who cares I guess?
  let a = atan2(v.vel.x, v.vel.y);
  let p = rotate(p1, a);
  let aspect = (res.y / res.x);
  return vec4f( v.pos.x - p.x * aspect, v.pos.y + p.y, 0., 1.); 
}

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {;
  let blue = 0.;
  return vec4f( pos.x / res.x, pos.y / res.y, blue , .25 );
}
