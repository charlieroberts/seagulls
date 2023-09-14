import { default as seagulls } from '../../seagulls.js'

const shader = `${seagulls.constants.vertex}

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  return vec4f( 1.,0.,0. , 1. );
}`

const sg = await seagulls.init()

sg.render( shader ).run()

