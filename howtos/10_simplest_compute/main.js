import { default as seagulls } from '../../seagulls.js'

const sg      = await seagulls.init(),
      frag    = await seagulls.import( './frag.wgsl' ),
      compute = await seagulls.import( './compute.wgsl' ),
      render  = seagulls.constants.vertex + frag,
      state   = sg.buffer( new Float32Array([ 0 ]) )

const renderPass  = sg.render({  shader:render,  data:[ state ] })
const computePass = sg.compute({ shader:compute, data:[ state ], dispatch:[1,1,1] }) 

sg.run( computePass, renderPass )
