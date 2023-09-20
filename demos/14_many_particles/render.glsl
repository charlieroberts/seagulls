struct VertexInput {
  @location(0) pos: vec2f,
  @builtin(instance_index) instance: u32,
};

struct Particle {
  pos: vec2f,
  speed: f32
};

@group(0) @binding(0) var<uniform> frame: f32;
@group(0) @binding(1) var<uniform> res:   vec2f;
@group(0) @binding(2) var<storage> state: array<Particle>;

@vertex 
fn vs( input: VertexInput ) ->  @builtin(position) vec4f {
  let size = input.pos * .015;
  let aspect = res.y / res.x;
  let p = state[ input.instance ];
  return vec4f( p.pos.x - size.x * aspect, p.pos.y + size.y, 0., 1.); 
}

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {;
  let blue = .5 + sin( frame / 60. ) * .5;
  return vec4f( pos.x / res.x, pos.y / res.y, blue , .1 );
}
