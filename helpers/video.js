const Video = {
  element:null,
  hasPermissions: false,
  async init( isCam=true) {
    const video = document.createElement('video');
    video.style.display = 'none'
    document.body.appendChild( video )
    if( isCam ) {
      return await Video.start( video )
    }else{
      video.src = isCam
    }
  },

  async start( element ) {
    let isStreaming = true 
    if (navigator.mediaDevices.getUserMedia) {
      const video = element
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      } catch {
        console.log( 'stream didnt work' )
        return false
      }

      Video.element = video
      Video.hasPermissions = true
      // note that one is lowercase and we need both!
      video.srcObject = stream
      Video.srcObject = stream
      await video.play()
      return true
    }else{
      console.warning( 'No video feed / webcam detected.' )
      return false
    }
  }
}

export default Video
