import { default as seagulls } from '../../seagulls.js'

const sg     = await seagulls.init(),
      frag   = await seagulls.import( './frag.wgsl' ),
      shader = seagulls.constants.vertex + frag

const frame = sg.uniform(0)

const render = sg.render({
  shader,
  data: [ frame ],
  onframe() { frame.value++ }
})

sg.run( render )
