import { default as seagulls } from '../../seagulls.js'
import { default as Mouse    } from '../../helpers/mouse.js'

const sg     = await seagulls.init(),
      frag   = await seagulls.import( './frag.wgsl' ),
      shader = seagulls.constants.vertex + frag

Mouse.init()

const mouse = sg.uniform( Mouse.values )

const render = sg.render({
  shader,
  data: [ mouse ],
  onframe() { mouse.value = Mouse.values }
})

sg.run( render )
