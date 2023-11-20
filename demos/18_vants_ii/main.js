import { default as seagulls } from '../../seagulls.js'

const NUM_AGENTS       = 128,//8192/8,
      GRID_SIZE        = 3,
      W                = Math.round( window.innerWidth  / GRID_SIZE ),
      H                = Math.round( window.innerHeight / GRID_SIZE ),
      WORKGROUP_SIZE   = 8,
      dc               = Math.ceil( Math.sqrt( NUM_AGENTS/64 ) ),
      DISPATCH_COUNT   = [ dc, dc, 1 ],
      DISPATCH_COUNT_2 = [ Math.ceil(W/8), Math.ceil(H/8), 1 ],
      LEFT = .25, RIGHT = .5,
      FADE = .00125

const render_shader = seagulls.constants.vertex + `
struct VertexInput {
  @location(0) pos: vec2f,
  @builtin(instance_index) instance: u32,
}

@group(0) @binding(0) var<storage> vants: array<f32>;
@group(0) @binding(1) var<storage> pheromones: array<f32>;
@group(0) @binding(2) var<storage> render: array<f32>;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let grid_pos = floor( pos.xy / ${GRID_SIZE}.);
  
  let pidx = grid_pos.y  * ${W}. + grid_pos.x;
  let p = pheromones[ u32(pidx) ];
  let v = render[ u32(pidx) ];

  let out = select( vec3(p) , select( vec3(.75,0.,0.), vec3f(0.,0.,.75), v==.5), v != 0. );
  
  return vec4f( out, 1. );
}`

const compute_shader_1 =`
struct Vant {
  pos: vec2f,
  dir: f32,
  flag: f32
}

@group(0) @binding(0) var<storage, read_write> vants: array<Vant>;
@group(0) @binding(1) var<storage, read_write> pheremones: array<f32>;
@group(0) @binding(2) var<storage, read_write> render: array<f32>;

fn vantIndex( cell:vec3u ) -> u32 {
  let size = ${WORKGROUP_SIZE}u;
  return cell.x + (cell.y * size); 
}

fn pheromoneIndex( vant_pos: vec2f ) -> u32 {
  let width = ${W}.;
  return u32( abs( vant_pos.y % ${H}. ) * width + vant_pos.x );
}

@compute
@workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE},1)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  let pi2   = ${Math.PI*2};
  let index = vantIndex( cell );
  var vant:Vant  = vants[ index ];

  let pIndex    = pheromoneIndex( vant.pos );
  let pheromone = pheremones[ pIndex ];

  // if pheromones were found
  if( pheromone != 0. ) {
    vant.dir += select(.25,-.25,vant.flag==0.); // turn 90 degrees counter-clockwise
    pheremones[ pIndex ] = 0.;  // set pheromone flag
  }else{
    vant.dir += select(-.25,.25,vant.flag==0.); // turn 90 degrees counter-clockwise
    pheremones[ pIndex ] = 1.;  // unset pheromone flag
  }

  // calculate direction based on vant heading
  let dir = vec2f( sin( vant.dir * pi2 ), cos( vant.dir * pi2 ) );
  
  vant.pos = round( vant.pos + dir ); 

  vants[ index ] = vant;
  
  // we'll look at the render buffer in the fragment shader
  // if we see a value of one a vant is there and we can color
  // it accordingly. in our JavaScript we clear the buffer on every
  // frame.
  render[ pIndex ] = (vant.flag + 1. ) / 2.;
}`

const compute_shader_2 = `
@group(0) @binding(0) var<storage, read_write> pheremones: array<f32>;

@compute
@workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE},1)

fn cs(@builtin(global_invocation_id) cell:vec3u)  {
  let pIndex = cell.y * ${W}u + cell.x;

  pheremones[ pIndex ] = max( pheremones[ pIndex ] - ${FADE} , 0.);
}
`
 
const NUM_PROPERTIES = 4 // must be evenly divisble by 4!
const pheromones   = new Float32Array( W*H ) // hold pheromone data
const vants_render = new Float32Array( W*H ) // hold info to help draw vants
const vants        = new Float32Array( NUM_AGENTS * NUM_PROPERTIES ) // hold vant info

for( let i = 0; i < NUM_AGENTS * NUM_PROPERTIES; i+= NUM_PROPERTIES ) {
  vants[ i ]   = Math.floor( (LEFT+Math.random()*RIGHT) * W ) // x
  vants[ i+1 ] = Math.floor( (LEFT+Math.random()*RIGHT) * H ) // y
  vants[ i+2 ] = 0 // direction 
  vants[ i+3 ] = Math.round( Math.random()  ) // vant behavior type 
}

const sg = await seagulls.init()
const vants_b = sg.buffer( vants )
const pheromones_b = sg.buffer( pheromones )
const vants_render_b = sg.buffer( vants_render )

const data = [
  vants_b,
  pheromones_b,
  vants_render_b
]


const render = sg.render({
  shader: render_shader,
  data,
  onframe() { vants_render_b.clear() },
})

const compute1 = sg.compute({
  shader: compute_shader_1,
  data,
  dispatchCount:DISPATCH_COUNT
})

const compute2 = sg.compute({
  shader: compute_shader_2,
  data: [ pheromones_b ],
  dispatchCount:DISPATCH_COUNT_2,
})

sg.run( compute1, compute2, render )
