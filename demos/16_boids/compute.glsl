struct Particle {
  pos: vec2f,
  vel: vec2f
};

@group(0) @binding(0) var<uniform> res:   vec2f;
@group(0) @binding(1) var<storage, read_write> state: array<Particle>;

fn cellindex( cell:vec3u ) -> u32 {
  let size = 8u;
  return cell.x + (cell.y * size) + (cell.z * size * size);
}

@compute
@workgroup_size(8,8)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  let count:u32 = 2048u;

  let idx            = cellindex( cell );
  var boid:Particle  = state[ idx ];

  var center:vec2f   = vec2f(0.); // rule 1
  var keepaway:vec2f = vec2f(0.); // rule 2
  var vel:vec2f      = vec2f(0.); // rule 3

  for( var i:u32 = 0u; i < count; i = i + 1u ) {
    // don't use boids' own properties in calculations
    if( idx == i ) { continue; }

    let _boid = state[ i ];
    
    // rule 1
    center += _boid.pos;
    
    // rule 2
    if( length( _boid.pos - boid.pos ) < .005 ) {
      keepaway = keepaway - ( _boid.pos - boid.pos );
    }
    
    // rule 3
    vel += _boid.vel;
  }

  // apply effects of rule 1
  center /= f32( count - 1u );
  boid.vel += (center-boid.pos) * .25;

  // apply effects of rule 2
  boid.vel += keepaway * .5 ;

  // apply effects of rule 3
  vel /= f32( count - 1u );
  boid.vel += vel * .025;

  // limit speed
  //if( length( boid.vel ) > 5. ) {
    boid.vel = select( boid.vel, (boid.vel / length(boid.vel)) * 10., length(boid.vel ) > 10. );
  //} 
  
  // calculate next position
  boid.pos = boid.pos + (2. / res) * boid.vel;

  // boundaries
  boid.pos.y = select( boid.pos.y, ((boid.pos.y + 1.) % 2.) - sign(boid.pos.y), abs(boid.pos.y) > 1.);
  boid.pos.x = select( boid.pos.x, ((boid.pos.x + 1.) % 2.) - sign(boid.pos.x), abs(boid.pos.x) > 1.);

  state[ idx ] = boid;
}
