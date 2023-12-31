import { default as seagulls } from '../../seagulls.js'

const NUM_AGENTS       = 2048*2048*2,
      W                = window.innerWidth,
      H                = window.innerHeight,
      WORKGROUP_SIZE   = 8,
      dc               = Math.ceil( Math.sqrt( NUM_AGENTS/64 ) ),
      DISPATCH_COUNT   = [ dc,dc, 1 ],
      DISPATCH_COUNT_2 = [ Math.ceil(W/8), Math.ceil(H/8), 1 ],
      LEFT = .2, RIGHT = .6,
      FADE = .0125

const render_shader = seagulls.constants.vertex + `
struct VertexInput {
  @location(0) pos: vec2f,
  @builtin(instance_index) instance: u32,
}

@group(0) @binding(0) var sampler1 : sampler;
@group(0) @binding(1) var pheromones: texture_2d<f32>;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let grid_pos = pos.xy / vec2f(${W}.,${H}.);
  
  let p = textureSample( pheromones, sampler1, grid_pos);

  return vec4(p.rgba );
}`

const compute_shader =`
struct Vant {
  pos: vec2f,
  dir: f32,
  mode: f32
}

@group(0) @binding(0) var<uniform> frame: f32;
@group(0) @binding(1) var<storage, read_write> vants: array<Vant>;
@group(0) @binding(2) var mysampler: sampler;
@group(0) @binding(3) var pheromones_in: texture_2d<f32>;
@group(0) @binding(4) var pheromones_out: texture_storage_2d<rgba16float, write>;

fn vantIndex( cell:vec3u ) -> u32 {
  let size = ${WORKGROUP_SIZE}u;
  return cell.x + (cell.y * size); 
}

fn readSensor( pos1:vec2f, dir:f32, angle:f32, distance:vec2f ) -> f32 {
  let res = vec2f(${W}., ${H}.);
  let read_dir = vec2f( sin( (dir+angle) * ${Math.PI*2} ), cos( (dir+angle) * ${Math.PI*2} ) );
  let offset1= read_dir * distance;
  let p = textureSampleLevel( pheromones_in, mysampler, pos1 + offset1, 0.);
  return p.r;
}

@compute
@workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE},1)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  let turn = .025 + abs(sin(frame/240.)) * .025;
  let index = vantIndex( cell );
  var vant:Vant = vants[ index ];

  let res = vec2f(${W}., ${H}.);
  let dist = 9.; //(13.+sin(frame/60.)*3.);
  let sensorDistance = vec2f( dist/res); 

  let pos = vant.pos/res;

  let left     = readSensor( pos, vant.dir, -turn, sensorDistance );
  let forward  = readSensor( pos, vant.dir, 0.,    sensorDistance );
  let right    = readSensor( pos, vant.dir, turn,  sensorDistance );
  
  if( left > forward && left > right ) {
    vant.dir -= turn; 
  }else if( right > left && right > forward ) { 
    vant.dir += turn;
  }else if ( right == left ) { 
    let rand = fract( sin( vant.pos.x ) * 100000.0 );
    if( rand > .5 ) {
      vant.dir += turn; 
    }else{
      vant.dir -= turn;
    }
  }
  
  let advance_dir = vec2f( sin( vant.dir * ${Math.PI*2} ), cos( vant.dir * ${Math.PI*2} ) );
  vant.pos = vant.pos + advance_dir * (5./res); 
  
  let current = textureSampleLevel( pheromones_in, mysampler, vant.pos/res, 0. );

  // wrap texture write position, can this be optimized?
  var write_pos:vec2f = vant.pos % res;
  // wrap x if negative
  if( sign(write_pos.x) == -1. ) { write_pos.x = res.x + write_pos.x; } 
  // wrap y if negative
  if( sign(write_pos.y) == -1. ) { write_pos.y = res.y + write_pos.y; } 

  textureStore( pheromones_out, vec2u( write_pos ), current + .1   );

  vants[ index ] = vant;
}`

const compute2 = `
@group(0) @binding(0) var samp: sampler;
@group(0) @binding(1) var pheromones: texture_2d<f32>;
@group(0) @binding(2) var pheromones_write: texture_storage_2d<rgba16float, write>;

fn getP( x:u32,y:u32 ) -> f32 {
  return textureLoad( pheromones, vec2u(x,y), 0 ).r;
}

@compute
@workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE},1)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  let x = cell.x;
  let y = cell.y;

  var state:f32 = getP( x,y ) * .98;
  state += getP(x - 1u, y) * 0.005;
  state += getP(x, y - 1u) * 0.005;
  state += getP(x + 1u, y) * 0.005;
  state += getP(x, y + 1u ) * 0.005;

  textureStore( pheromones_write, cell.xy, vec4f(state,state,state,state) * .999);
}
`
 
const NUM_PROPERTIES = 4 // must be evenly divisble by 4!
const pheromones   = new Float32Array( W*H ) // hold pheromone data
const vants        = new Float32Array( NUM_AGENTS * NUM_PROPERTIES ) // hold vant info

let PI2 = Math.PI * 2
for( let i = 0; i < NUM_AGENTS; i++ ) {
  const xdir = (W/2) + (Math.sin((i/NUM_AGENTS)) * (W/4))
  const ydir = (H/2) + (Math.sin((i/NUM_AGENTS)) * (H/4))

  vants[ (i*4) ]   = Math.random() * W
  vants[ (i*4)+1 ] = Math.random() * H 
 
  vants[ (i*4)+2 ] = i/NUM_AGENTS 
}

const sg = await seagulls.init()
const pheromones_t  = sg.texture( pheromones, 'rgba16float' )
const pheromones_t1 = sg.storageTexture( pheromones )
const vants_b = sg.buffer( vants )
const frame_u = sg.uniform( 0 )
const pheromones_p = sg.pingpong( pheromones_t, pheromones_t1 )

const render = sg.render({
  shader: render_shader,
  data:[
    sg.sampler(),
    pheromones_p
  ],
  blend:true
})

const sim = sg.compute({
  shader:compute_shader,
  data:[
    frame_u,
    vants_b,
    sg.sampler(),
    pheromones_p
  ],
  dispatchCount:DISPATCH_COUNT
})

const diffuse = sg.compute({
  shader:compute2,
  data:[
    sg.sampler(),
    pheromones_p
  ],
  dispatchCount: DISPATCH_COUNT_2
})


sg.run( diffuse, sim,  render )
