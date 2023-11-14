import { default as seagulls } from '../../seagulls.js'

const sg      = await seagulls.init(),
      frag    = await seagulls.import( './frag.wgsl' ),
      compute = await seagulls.import( './compute.wgsl' ),
      render  = seagulls.constants.vertex + frag,
      size    = (window.innerWidth * window.innerHeight),
      state   = new Float32Array( size*2 )

for( let i = 0; i < size; i+=2 ) {
  state[ i ] = 1
  if( i > size - (size/50) && i < size + (size/50)) {
    state[ i + 1 ] = 1
  }
}

const statebuffer1 = sg.buffer( state )
const statebuffer2 = sg.buffer( state )
const res = sg.uniform([ window.innerWidth, window.innerHeight ])
const renderPass = sg.render({
  shader: render,
  data: [
    res,
    sg.pingpong( statebuffer1, statebuffer2 )
  ]
})

const coeffs = sg.uniform( [.055,.062,1,.5] )

const computePass = sg.compute({
  shader: compute,
  data: [ 
    res, 
    coeffs,
    sg.pingpong( statebuffer1, statebuffer2 ) 
  ],
  dispatchCount:  [Math.round(seagulls.width / 8), Math.round(seagulls.height/8), 1],
  times:10
})


sg.run( computePass, renderPass )
