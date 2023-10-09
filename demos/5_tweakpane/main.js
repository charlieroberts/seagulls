import { default as seagulls } from '../../seagulls.js'
import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.1/dist/tweakpane.min.js'

const sg     = await seagulls.init(),
      frag   = await seagulls.import( './frag.wgsl' ),
      shader = seagulls.constants.vertex + frag

const params = { background: { r:0, g:0, b:0  } }
const pane   = new Pane()

pane.addBinding( params, 'background', { color: { type:'float' } })

// Object.values() creates an array out all the values
// in a javascript dictionary and ignores the keys
const color = sg.uniform( Object.values( params.background ) )

const render = sg.render({
  shader,
  data: [ color ],
  onframe() { color.value = Object.values( params.background ) } 
})

sg.run( render )
