import { default as seagulls } from '../../seagulls.js'

const sg      = await seagulls.init(),
      frag    = await seagulls.import( './frag.wgsl' ),
      compute = await seagulls.import( './compute.wgsl' ),
      render  = seagulls.constants.vertex + frag,
      size    = window.innerWidth * window.innerHeight,
      state   = new Float32Array( size )

for( let i = 0; i < size; i++ ) {
  state[ i ] = Math.random()
}

const dispatch_size = Math.ceil( size / 64 )  
const statebuffer   = sg.buffer( state )

const renderPass = sg.render({
  shader: render,
  data: [
    sg.uniform([ window.innerWidth, window.innerHeight ]),
    statebuffer
  ]
})

const computePass = sg.compute({
  shader: compute,
  data: [ statebuffer ],
  dispatchCount: [dispatch_size,1,1]
})

sg.run( computePass, renderPass )
