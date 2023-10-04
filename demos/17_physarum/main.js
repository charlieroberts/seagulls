import { default as seagulls } from '../../seagulls.js'

const NUM_AGENTS       = 2048*2048,
      GRID_SIZE        = 1,
      W                = Math.round( window.innerWidth  / GRID_SIZE ),
      H                = Math.round( window.innerHeight / GRID_SIZE ),
      WORKGROUP_SIZE   = 8,
      dc               = Math.ceil( Math.sqrt( NUM_AGENTS/64 ) ),
      DISPATCH_COUNT   = [ dc,dc, 1 ],
      DISPATCH_COUNT_2 = [ Math.ceil(W/8), Math.ceil(H/8), 1 ],
      LEFT = .0, RIGHT = 1.,
      FADE = .0125

const render_shader = seagulls.constants.vertex + `
struct VertexInput {
  @location(0) pos: vec2f,
  @builtin(instance_index) instance: u32,
}

@group(0) @binding(0) var<uniform> frame: f32;
@group(0) @binding(1) var<storage> vants: array<f32>;
@group(0) @binding(2) var<storage> pheromones: array<f32>;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let grid_pos = floor( pos.xy / ${GRID_SIZE}.);
  
  let pidx = grid_pos.y  * ${W}. + grid_pos.x;
  let p = pheromones[ u32(pidx) ];

  return vec4f( vec3(p*80.),1. );
}`

const compute_shader =`
struct Vant {
  pos: vec2f,
  dir: f32,
  mode: f32
}

@group(0) @binding(0) var<uniform> frame: f32;
@group(0) @binding(1) var<storage, read_write> vants: array<Vant>;
@group(0) @binding(2) var<storage, read_write> pheromones: array<f32>;
@group(0) @binding(3) var<storage, read_write> render: array<f32>;

fn vantIndex( cell:vec3u ) -> u32 {
  let size = ${WORKGROUP_SIZE}u;
  return cell.x + (cell.y * size); 
}

fn pheromoneIndex( vant_pos: vec2f ) -> u32 {
  return u32( round(vant_pos.y * ${W}. + vant_pos.x) );
}

fn readSensor( pos:vec2f, dir:f32, angle:f32, distance:vec2f ) -> f32 {
  let read_dir = vec2f( sin( (dir+angle) * ${Math.PI*2} ), cos( (dir+angle) * ${Math.PI*2} ) );
  let offset = read_dir * distance;
  let index = pheromoneIndex( round(pos+offset) );
  return pheromones[ index ];
}

@compute
@workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE},1)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  let turn = .075;
  let index = vantIndex( cell );
  var vant:Vant = vants[ index ];

  var pIndex:u32 = pheromoneIndex( round(vant.pos) );

  let sensorDistance = vec2f( 7. + sin(frame/200.) * 3. ); 

  let left     = readSensor( vant.pos, vant.dir, -turn, sensorDistance );
  let forward  = readSensor( vant.pos, vant.dir, 0.,    sensorDistance );
  let right    = readSensor( vant.pos, vant.dir, turn,  sensorDistance );
  
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
  vant.pos = vant.pos + advance_dir * .1 ; 
  pIndex = pheromoneIndex( round(vant.pos) );

  pheromones[ pIndex ] += .01;

  vants[ index ] = vant;
}`

const compute2 = `
@group(0) @binding(0) var<uniform> frame: f32;
@group(0) @binding(1) var<storage, read_write> pheromones: array<f32>;
@group(0) @binding(2) var<storage, read_write> pheromones_write: array<f32>;

fn getP( x:u32,y:u32 ) -> f32 {
  let idx = u32( y * ${W}u + x );
  return pheromones[ idx ];
}

@compute
@workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE},1)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  let x = cell.x;
  let y = cell.y;

  var state:f32 = getP( x,y ) * -1.;
  state += getP(x - 1u, y) * 0.2;
  state += getP(x - 1u, y - 1u) * 0.05;
  state += getP(x, y - 1u) * 0.2;
  state += getP(x + 1u, y - 1u ) * 0.05;
  state += getP(x + 1u, y) * 0.2;
  state += getP(x + 1u, y + 1u ) * 0.05;
  state += getP(x, y + 1u ) * 0.2;
  state += getP(x - 1u, y + 1u ) * 0.05;

  let pIndex = y * ${W}u + x;
  pheromones[ pIndex ] = state * .4;
}
`
 
const NUM_PROPERTIES = 4 // must be evenly divisble by 4!
const pheromones   = new Float32Array( W*H ) // hold pheromone data
const vants_render = new Float32Array( W*H ) // hold info to help draw vants
const vants        = new Float32Array( NUM_AGENTS * NUM_PROPERTIES ) // hold vant info

for( let i = 0; i < NUM_AGENTS * NUM_PROPERTIES; i+= NUM_PROPERTIES ) {
  vants[ i ]   = Math.floor( (LEFT+Math.random()*RIGHT) * W ) // x
  vants[ i+1 ] = Math.floor( (LEFT+Math.random()*RIGHT) * H ) // y
  vants[ i+2 ] = Math.floor( Math.random() * 4 ) / 4 // direction 
  vants[ i+3 ] = Math.random() 
}

const sg = await seagulls.init()

let frame = 0
sg.buffers({
    vants,
    pheromones,
    pheromonesB:pheromones,
    vants_render
  })
  .uniforms({ frame })
  .onframe( ()=> sg.uniforms.frame = frame++ )
  .backbuffer( false )
  .blend( true )
  .compute( compute_shader, DISPATCH_COUNT )
  .compute( compute2, DISPATCH_COUNT_2, { buffers:['pheromones', 'pheromonesB'] })
  .render( render_shader )
  .run(1)
