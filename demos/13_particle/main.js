import { default as seagulls } from '../../seagulls.js'

const initState = new Float32Array([ 0,0 ])

const sg = await seagulls.init(),
      render_shader  = await seagulls.import( './frag.wgsl' ),
      compute_shader = await seagulls.import( './compute.wgsl' ),
      frame = sg.uniform(0),
      res   = sg.uniform( [sg.width, sg.height] ),
      state = sg.buffer( initState )  

const render = sg.render({
  shader:render_shader,
  data:[
    frame,
    res,
    state
  ],
  onframe() { frame.value++ }
})

const compute = sg.compute({
  shader:compute_shader,
  data:[
    res,
    state
  ],
  dispatchCount:[1,1,1]
})

sg.run( compute, render )
