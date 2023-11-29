import { default as seagulls } from '../../seagulls.js'
import { default as Audio    } from '../../helpers/audio.js'

/* audio
 *
 * there is a very simple helper for audio analysis in
 * seagulls that will perform an FFT on audio coming into
 * your microphone (or another audio input of your choice).
 * The FFT is averaged into three different bands, one each
 * for low, mid, and high frequency content strength.
 *
 * For audio on the web, you need to wait until the user
 * has interacted with the page in some way before starting
 * it. In this demo we'll simply wait until the user has
 * clicked anywhere on the page to start the audio.
 */ 

const shader = `${seagulls.constants.vertex}

@group(0) @binding(0) var<uniform> audio : vec3f;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  return vec4f( audio, 1. );
}`

// initialize seagulls
const sg = await seagulls.init()

// start audio when user clicks in window
document.body.onclick = e => Audio.start()

sg
  .uniforms({ audio:[0,0,0] })
  // update audio fft values
  .onframe( ()=> sg.uniforms.audio = [ Audio.low, Audio.mid, Audio.high ] )
  .render( shader )
  .run()
