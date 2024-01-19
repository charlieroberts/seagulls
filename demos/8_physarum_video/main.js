import { default as seagulls } from '../../seagulls.js'
import { default as Video    } from '../../helpers/video.js'

await Video.init()

const AGENT_ROOT       = 2048,
      NUM_AGENTS       = AGENT_ROOT * AGENT_ROOT,
      W                = window.innerWidth,
      H                = window.innerHeight,
      WORKGROUP_SIZE   = 8,
      dc               = AGENT_ROOT,
      DISPATCH_COUNT   = [ dc/8,dc/8, 1 ],
      DISPATCH_COUNT_2 = [ Math.ceil(W/8), Math.ceil(H/8), 1 ]

const st = 'rgba16float'

const render_shader = seagulls.constants.vertex + `
struct VertexInput {
  @location(0) pos: vec2f,
  @builtin(instance_index) instance: u32,
}

@group(0) @binding(0) var sampler1 : sampler;
@group(0) @binding(1) var pheromones: texture_2d<f32>;
@group(1) @binding(0) var videoBuffer: texture_external;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let grid_pos = pos.xy / vec2f( ${W}.,${H}.);
  let video    = textureSampleBaseClampToEdge( videoBuffer, sampler1, grid_pos );
  let p        = textureSample( pheromones, sampler1, grid_pos );
  return video + p;
}`

const compute_shader =`
struct Vant {
  pos: vec2f,
  dir: vec2f,
}

@group(0) @binding(0) var<uniform> frame: f32;
@group(0) @binding(1) var<storage, read_write> vants: array<Vant>;
@group(0) @binding(2) var mysampler: sampler;
@group(0) @binding(3) var pheromones_in: texture_2d<f32>;
@group(0) @binding(4) var pheromones_out: texture_storage_2d<${st}, write>;
@group(1) @binding(0) var videoBuffer:    texture_external;

fn vantIndex( cell:vec3u ) -> u32 {
  let size = ${WORKGROUP_SIZE}u * ${dc}u;
  return cell.x + (cell.y * size) + (cell.z * size * size); 
}

fn readSensor( pos:vec2f, dir:vec2f, angle:f32, distance:vec2f  ) -> f32 {
  let read_dir = rotate( dir, angle ); 
  let offset   = read_dir * distance;
  
  let video = textureSampleBaseClampToEdge( videoBuffer, mysampler, pos+offset );
  let p = textureSampleLevel( pheromones_in, mysampler, pos + offset, 0. );

  return video.r;// + p.r / 100.;
}

fn rotate(dir:vec2f, angle:f32) -> vec2f {
  let  s = sin( angle );
  let  c = cos( angle );
  let  m = mat2x2<f32>( c, -s, s, c );
  return m * dir;
}
 
@compute
@workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE},1)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  let turn = ${Math.PI/6};
  let index     = vantIndex( cell );
  var vant:Vant = vants[ index ];

  let res   = vec2f(${W}., ${H}.);
  let pixel = 1. / res;
  let dist  = pixel * 9.;
  let pos   = vant.pos;

  let left     = readSensor( pos, vant.dir, -turn, dist );
  let forward  = readSensor( pos, vant.dir, 0.,    dist );
  let right    = readSensor( pos, vant.dir, turn,  dist );
  
  if( left > forward && left > right ) {
    vant.dir = rotate( vant.dir, -turn ); 
  }else if( right > left && right > forward ) { 
    vant.dir = rotate( vant.dir, turn);
  }else if ( right == left ) { 
    let rand = fract( sin( vant.pos.x ) * 100000.0 );
    if( rand > .5 ) {
      vant.dir = rotate( vant.dir, turn); 
    }else{
      vant.dir = rotate( vant.dir, -turn);
    }
  }
  
  vant.pos += vant.dir * dist / 2.;

  // > 1 handled by mod operator in textureStore
  if( vant.pos.x < 0 ) { vant.pos.x += 1.; }
  if( vant.pos.y < 0 ) { vant.pos.y += 1.; }

  let current = textureSampleLevel( pheromones_in, mysampler, vant.pos, 0. );

  textureStore( 
    pheromones_out, 
    vec2u( (vant.pos % 1.) * res ), 
    current.rgba + .1 
  );

  vants[ index ] = vant;
}`

const compute2 = `
@group(0) @binding(0) var samp: sampler;
@group(0) @binding(1) var pheromones: texture_2d<f32>;
@group(0) @binding(2) var pheromones_write: texture_storage_2d<${st}, write>;

fn getP( x:u32,y:u32 ) -> f32 {
  return textureLoad( pheromones, vec2u(x,y), 0 ).r;
}

@compute
@workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE},1)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  let x = cell.x;
  let y = cell.y;

  var state:f32 = getP( x,y ) * .92;
  state += getP(x - 1u, y) * 0.02;
  state += getP(x, y - 1u) * 0.02;
  state += getP(x + 1u, y) * 0.02;
  state += getP(x, y + 1u ) * 0.02;
  state *= .9;

  textureStore( pheromones_write, cell.xy, vec4f( state,state,state,1. ));
}
`
 
const NUM_PROPERTIES = 4 // must be evenly divisble by 4!
const pheromones   = new Uint8Array( W*H ) // hold pheromone data
const vants        = new Float32Array( NUM_AGENTS * NUM_PROPERTIES ) // hold vant info

for( let i = 0; i < NUM_AGENTS; i++ ) {
  vants[ (i*4) ]   =.5
  vants[ (i*4)+1 ] =.5
 
  vants[ (i*4)+2 ] = Math.random() 
  vants[ (i*4)+3 ] = Math.random()
}

const sg = await seagulls.init()
const pheromones_t  = sg.texture( pheromones, st )
const pheromones_t1 = sg.storageTexture( pheromones, st )
const vants_b = sg.buffer( vants )
const frame_u = sg.uniform( 0 )
const pheromones_p = sg.pingpong( pheromones_t, pheromones_t1 )
const video = sg.video( Video.element )

const render = sg.render({
  shader: render_shader,
  data:[
    sg.sampler({ magFilter:'nearest', maxFilter:'nearest' }),
    pheromones_p,
    video,
  ],
  blend:true
})

let frame = 0

const sim = sg.compute({
  shader:compute_shader,
  data:[
    frame_u,
    vants_b,
    sg.sampler({ minFilter:'nearest', maxFilter:'nearest' }),
    pheromones_p,
    video
  ],
  dispatchCount:DISPATCH_COUNT,
  onframe() { 
    frame_u.value = frame++
  }
})

const diffuse = sg.compute({
  shader:compute2,
  data:[
    sg.sampler({ minFilter:'nearest', maxFilter:'nearest' }),
    pheromones_p
  ],
  dispatchCount: DISPATCH_COUNT_2
})


sg.run( diffuse, sim, render )
