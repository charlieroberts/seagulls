import { default as seagulls } from '../../seagulls.js'

/* game of life
 * This demo runs the game of life where each
 * pixel is a cell. The demo uses two buffers
 * to hold state, every time we run the compute
 * shader one is used to read while the other is
 * used to write. This is critical for any simulation
 * that relies on looking at multiple values in a buffer,
 * as you don't want to be reading values while writing
 * over them. Seagulls handles this buffer swapping 
 * (aka pingpong) for you behind the scenes, but there's
 * a tiny bit of extra code you need to add that is discussed
 * below. 
 */

const frag = `
// resolution of viewport
@group(0) @binding(0) var<uniform> res:   vec2f;

// declare state to be an array of 32-bit floats
@group(0) @binding(1) var<storage> state: array<f32>;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  // we derive the index into our array with the formula
  // row number * width + column number
  let idx : u32 = u32( pos.y * res.x + pos.x );
  let v = state[ idx ];
  return vec4f( v,v,v, 1.);
}`

const compute_shader =`
@group(0) @binding(0) var<uniform> res: vec2f;
@group(0) @binding(1) var<storage, read_write> statein: array<f32>;
@group(0) @binding(2) var<storage, read_write> stateout: array<f32>;

// our buffer is a 1D array holding all cells.
// this is a convenience function to make it
// easy to determine an index into our buffer
// for a given xy pair. we'll use this
// when looking at all the neighbors of each cell.
fn index( x:u32, y:u32 ) -> u32 {
  return y * u32(res.x) + x;
}

// here we specify a workgroup size of 64. this
// should always be a power of 8 for optimization on
// nvidia cards, 64 is a common default size that
// should work on most graphics cards.
@compute @workgroup_size(8,8)

fn cs(
  @builtin(global_invocation_id) cell:vec3u
)  {
  // get the index of this particular cell
  let i = index(cell.x, cell.y);

  // get the current active neighbor count by looking
  // at the eight cells surrounding the current one
  let activeNeighbors = statein[ index(cell.x + 1u, cell.y + 1u) ] + // upper right
                        statein[ index(cell.x + 1u, cell.y)      ] + // right
                        statein[ index(cell.x + 1u, cell.y - 1u) ] + // lower right
                        statein[ index(cell.x, cell.y - 1u)      ] + // down 
                        statein[ index(cell.x - 1u, cell.y - 1u) ] + // lower left
                        statein[ index(cell.x - 1u, cell.y)      ] + // left
                        statein[ index(cell.x - 1u, cell.y + 1u) ] + // upper left
                        statein[ index(cell.x, cell.y + 1u)      ];  // up

  if( activeNeighbors == 2.0 ) {
    stateout[i] = statein[i];
  }else if( activeNeighbors == 3.) {
    stateout[i] = 1.;
  }else{
    stateout[i] = 0.;
  }
}
`
const sg      = await seagulls.init(),
      render_shader  = seagulls.constants.vertex + frag,
      size    = window.innerWidth * window.innerHeight,
      state   = new Float32Array( size )

// set our initial state to be either 0 or 1, randomly
for( let i = 0; i < size; i++ ) {
  state[ i ] = Math.round( Math.random() )
}

// our workgroups are 8x8 in size. To determine
// the number of times we need to run our compute
// shader, we divide our width and height by 8
// and round up.
const workgroup_count = [
  Math.round( window.innerWidth /  8), 
  Math.round( window.innerHeight / 8), 
  1
] 

// we'll pass two buffers here and initialize them
// both with the state array above. on the first frame,
// the compute shader will read from A and then
// write B... on each subsequent frame this behavior
// will flip. This ensures we're never trying to write
// to the same data that we're reading from, which would
// mess up the game of life simulation (and many others).
sg.buffers({ stateA:state, stateB:state })
  .uniforms({ resolution:[ window.innerWidth, window.innerHeight ] })
  .backbuffer( false )
// a value of 1 for pingpong() does nothing, but if you
// turn it up the compute shader will be executed multiple
// times per frame... you can use this to accelerate the
// simulation (important for simulations like reaction diffusion).
  .pingpong( 1 )
// compute() accepts three arguments:
// 1) the compute shader itself
// 2) the number of workgroups to run across three dimensions
// 3) a list of named buffers to "pingpong", where read/write
//    operations will flip from one execution to the next with another
//    paired buffer. in this case, stateA will flip with stateB.
  .compute( 
    compute_shader, 
    workgroup_count,
    { pingpong:['stateA'] } 
  )
  .render( render_shader )
  .run()

