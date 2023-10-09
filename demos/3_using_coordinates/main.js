import { default as seagulls } from '../../seagulls.js'

const sg     = await seagulls.init(),
      frag   = await seagulls.import( './frag.wgsl' ),
      shader = seagulls.constants.vertex + frag

const res = sg.uniform( [window.innerWidth, window.innerHeight] )

const render = sg.render({ shader, data:[ res ] })
  
sg.run( render )
