const CONSTANTS = {
  quadVertices: new Float32Array([
    -1,-1,
    1,-1,
    1,1,
    -1,-1,
    1,1,
    -1,1
  ]),

  defaultStorageFlags : GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,

  workgroupSize: 8,

  blend:{
    color: {
      srcFactor: 'src-alpha',
      dstFactor: 'one-minus-src-alpha',
      operation: 'add',
    },
    alpha: {
      srcFactor: 'one',
      dstFactor: 'one-minus-src-alpha',
      operation: 'add',
    }
  },

  vertex:`@vertex 
fn vs( @location(0) input : vec2f ) ->  @builtin(position) vec4f {
  return vec4f( input, 0., 1.); 
}

`, textureFormat:'rgba8unorm'
}

// to "fix" inconsistencies with device.writeBuffer
const mult = navigator.userAgent.indexOf('Chrome') === -1 ? 4 : 1

let backTexture = null
const seagulls = {
  constants:CONSTANTS,

  async getDevice() {
    const adapter = await navigator.gpu?.requestAdapter()
    const device = await adapter?.requestDevice()

    if (!device) {
      console.error('need a browser that supports WebGPU')
      return
    }

    return device
  },
  
  setupCanvas( device=null, canvas=null ) {
    if( canvas === null ) canvas = document.getElementsByTagName('canvas')[0]
    if( canvas === null ) {
      console.error('could not find canvas to initialize seagulls')
      return
    }

    const context = canvas.getContext('webgpu'),
          format  = navigator.gpu.getPreferredCanvasFormat()

    context.configure({
      device,
      format,
      alphaMode:'premultiplied',
      usage:GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
    })

    const devicePixelRatio = window.devicePixelRatio || 1
    seagulls.width  = canvas.width  = Math.floor(window.innerWidth ) // * devicePixelRatio)
    seagulls.height = canvas.height = Math.floor(window.innerHeight) //* devicePixelRatio)
    canvas.style.height = seagulls.height + 'px'
    canvas.style.width  = seagulls.width  + 'px'

    backTexture = seagulls.createTexture( device, format, canvas )

    return [ canvas, context, format ]
  },

  async import( file ) {
    const f = await fetch( file )
    const txt = await f.text()

    return txt
  },

  createTexture( device, format, canvas, usage=null ) {
    console.log( 'texture:', usage )
    const tex = device.createTexture({
      size: Array.isArray( canvas ) ? canvas : [canvas.width, canvas.height],
      format,
      usage: usage===null ? GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST : usage
    })

    return tex
  },

  createVertexBuffer2D( device, vertices, stride=8, label='vertex buffer' ) {
    const buffer = device.createBuffer({
      label,
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer( buffer, 0, vertices )
    
    // would need to change arrayStride to 12 for 3D vertices
    const vertexBufferLayout = {
      arrayStride: stride,
      attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0, 
      }],
    }

    return [buffer, vertexBufferLayout]

  },

  createStorageBuffer( device=null, storage=null, label='storage', usage=CONSTANTS.defaultStorageFlags, offset=0 ) {
    const buffer = device.createBuffer({
      label,
      usage,
      size: storage.byteLength,
    })

    device.queue.writeBuffer( buffer, offset, storage )

    return buffer
  },

  createUniformBuffer( device, values, label='seagull uniforms' ) {
    const arr = new Float32Array(values)

    const buff = device.createBuffer({
      label: label + (Math.round( Math.random() * 100000 )),
      size:  arr.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    device.queue.writeBuffer( buff, 0, arr )

    return buff
  },

  
  createSimulationPipeline( device, pingponglayout, code ) {
    const layout = device.createPipelineLayout({
      label:'cell pipeline layout',
      bindGroupLayouts: [ pingponglayout ]
    })

    const module = device.createShaderModule({
      label: 'sim',
      code
    })

    const p = device.createComputePipeline({
      label: 'sim',
      layout,
      compute: {
        module,
        entryPoint: 'cs'
      }
    })

    return p
  },

  createLayoutEntry( data, count=0, type='render', readwrite='read-only-storage' ) {
    let entry
    // XXX this needs to be fixed for vertex-based simulations
    // comment out | GPUShaderStage.VERTEX for readwrite in compute
    const visibility = type === 'render'
      ? GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX 
      : GPUShaderStage.COMPUTE

    switch( data.type ) {
      case 'uniform':
        entry = {
          binding:    count,
          visibility,
          buffer:     { type:'uniform' }
        }
        break
      case 'texture': case 'feedback':
        entry = {
          binding:    count,
          visibility,
          texture:    {}
        }
        break
      case 'storageTexture':
        entry = {
          binding: count,
          visibility,
          storageTexture:{
            format:CONSTANTS.textureFormat
          }
        }
        break
      case 'sampler':
        entry = {
          binding:    count,
          visibility,
          sampler:    {}
        }
        break
      case 'buffer':
        // make sure we don't specify buffers as read/write for fragment
        // and vertex shaders
        const __type = type === 'render' ? 'read-only-storage' : readwrite 
        
        entry = {
          visibility,
          binding: count,
          buffer:  { type: __type } 
        }
        break
    }

    return entry
  },

  // how to handle feedback/back buffer?
  createBindGroupLayout( device, data, type='render', label='render layout' ) {
    let count = 0
    const entries = []

    if( data !== null ) {
      for( let d of data ) {
        if( d.type === 'video' ) continue

        if( d.type === 'pingpong' ) {
          if( d.b.type === 'texture' ) d.b.type = 'storageTexture'
          entries.push( seagulls.createLayoutEntry( d.a, count++, type ) )
          entries.push( seagulls.createLayoutEntry( d.b, count++, type, 'storage' ) )
        }else{
          // TODO is it safe to assume that a buffer not included in a pingpong will always
          // be read/write as part of a compute shader?
          const mode = type === 'compute' ? 'storage' : 'read-only-storage'
          entries.push( seagulls.createLayoutEntry( d, count++, type, mode ) )
        }
      }
    }

    const bindGroupLayout = device.createBindGroupLayout({
      label,
      entries
    })

    return bindGroupLayout
  },

  createRenderBindGroupEntry( data, count ) {
    let entry
    switch( data.type ) {
      case 'uniform':
        entry = {
          binding:  count,
          resource: { buffer: data },
        }
        break
      case 'texture': case 'storageTexture':
        entry = {
          binding:  count,
          resource: data.createView() 
        }
        break
      case 'storageTexture':
        entry = {
          binding:  count,
          resource: data.createView({ format:CONSTANTS.textureFormat }) 
        }
        break;
      case 'feedback':
        entry = {
          binding:  count,
          resource: backTexture.createView() 
        }
        break
      case 'sampler':
        entry = {
          binding: count,
          resource: data.sampler,
        }
        break
      case 'buffer':
        entry = {
          binding: count,
          resource:  { buffer:data.buffer } 
        }
        break
    }
    entry.type = data.type

    return entry
  },

  createBindGroups( device, layout, data, pingpong=false ) {
    const entriesA = [],
          entriesB = []

    pingpong = !!pingpong

    let count = 0 

    if( data !== null ) {
      for( let d of data ) {
        if( d.type === 'video' ) continue
        if( d.type !== 'pingpong' ) {
          const entry = seagulls.createRenderBindGroupEntry( d, count++ )
          entriesA.push( entry )
          if( pingpong ) entriesB.push( entry )
        }else{
          const a = seagulls.createRenderBindGroupEntry( d.a, count ),
                b = seagulls.createRenderBindGroupEntry( d.b, count + 1 ),
                a1= seagulls.createRenderBindGroupEntry( d.a, count + 1 ),
                b1= seagulls.createRenderBindGroupEntry( d.b, count )

          entriesA.push( a, b  )
          entriesB.push( a1,b1 )

          count += 2
        }
      }
    }

    const bindGroups = [
      device.createBindGroup({
        label:`${name} a`,
        layout,
        entries:entriesA
      })
    ]
    
    // we only need a second bind group if
    // we are pingponging textures / buffers
    if( pingpong === true ) {
      bindGroups.push(
        device.createBindGroup({
          label:`${name} b`,
          layout,
          entries: entriesB      
        })
      )
    }

    return bindGroups
  },

  createRenderPipeline( device, code, presentationFormat, vertexBufferLayout, bindGroupLayout, data, shouldBlend=false ) {
    const module = device.createShaderModule({
      label: 'main render',
      code
    })

    const bindGroupLayouts = [ bindGroupLayout ]
    const videos = data !== null ? data.filter( d => d.type === 'video' ) : null
    const hasExternalTexture = videos !== null && videos.length > 0 

    if( navigator.userAgent.indexOf('Firefox') === -1 && hasExternalTexture ) {
      const externalEntry = {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        externalTexture:{}
      }

      const externalLayout = device.createBindGroupLayout({
        label:'external layout',
        entries:[ externalEntry ]
      })

      bindGroupLayouts.push( externalLayout )
    }

    const pipelineLayout = device.createPipelineLayout({
      label: "render pipeline layout",
      bindGroupLayouts
    })

    const pipeline = device.createRenderPipeline({
      label: "render pipeline",
      layout:pipelineLayout,
      vertex: {
        module,
        entryPoint: "vs",
        buffers: [vertexBufferLayout]
      },
      fragment: {
        module,
        entryPoint: "fs",
        targets: [{
          format: presentationFormat,
          blend: shouldBlend ? CONSTANTS.blend : undefined
        }]
      }
    });

    return pipeline
  },

  createRenderStage( device, props, presentationFormat ) {
    const shader = props.shader,
          data   = props.data,
          blend  = props.blend

    const vertices = props.vertices
    const [vertexBuffer, vertexBufferLayout] = seagulls.createVertexBuffer2D( device, vertices )

    const renderLayout = seagulls.createBindGroupLayout( device, props.data )

    // check all entries to see if any need to pingpong
    let shouldPingPong = false
    if( props.data !== null )
      shouldPingPong = props.data.reduce( (a,v) => a + (v.type === 'pingpong' ? 1 : 0), 0 )

    const bindGroups = seagulls.createBindGroups( device, renderLayout, props.data, shouldPingPong )

    let textures = []
    if( props.data !== null )
      textures   = props.data.filter( d => d.type === 'texture' )

    const pipeline   = seagulls.createRenderPipeline( 
      device, 
      shader, 
      presentationFormat, 
      vertexBufferLayout, 
      renderLayout, 
      data, 
      blend 
    )

    return [ pipeline, bindGroups, vertexBuffer ]
  },

  createSimulationStage( device, computeShader, data ) {
    let shouldPingPong = false
    if( data !== null )
      shouldPingPong = !!data.reduce( (a,v) => a + (v.type === 'pingpong' ? 1 : 0), 0 )

    const simLayout     = seagulls.createBindGroupLayout( device, data, 'compute', 'compute layout' ) 
    const simBindGroups = seagulls.createBindGroups( device, simLayout, data, shouldPingPong, 'compute' ) 
   
    const simPipeline   = seagulls.createSimulationPipeline( device, simLayout, computeShader )

    return [ simPipeline, simBindGroups ]
  },

  pingpong( encoder, pass ) {
    for( let i = 0; i < pass.times; i++ ) {
      const computePass = encoder.beginComputePass()
      const bindGroupIndex = pass.shouldPingPong === true ? pass.step++ % 2 : 0
      
      computePass.setPipeline( pass.pipeline )
      computePass.setBindGroup( 0, pass.bindGroups[ bindGroupIndex ] ) 

      if( Array.isArray( pass.dispatchCount ) ) {
        computePass.dispatchWorkgroups( pass.dispatchCount[0], pass.dispatchCount[1], pass.dispatchCount[2] )
      }else{
        computePass.dispatchWorkgroups( pass.dispatchCount,pass.dispatchCount,1 )
      }

      computePass.end()
    }
    
    return pass.step
  },

  render( encoder, passDesc ) {
    const shouldCopy = passDesc.context !== null

    const renderPassDescriptor = {
      label: 'render',
      colorAttachments: [{
        view: passDesc.view,
        clearValue: passDesc.clearValue,
        loadOp:  'clear',
        storeOp: 'store',
      }]
    }

    const externalLayout = passDesc.device.createBindGroupLayout({
      label:'external layout',
      entries:[{
        binding:0,
        visibility: GPUShaderStage.FRAGMENT,
        externalTexture: {}
      }]
    })
    
    let resource = null,
        videos   = passDesc.data !== null ? passDesc.data.filter( d => d.type === 'video' ) : null,
        useVideo = navigator.userAgent.indexOf('Firefox') === -1 && videos !== null && videos.length > 0

    
    let externalTextureBindGroup = null

    if( useVideo )  {
      try {
        resource = passDesc.device.importExternalTexture({
          source:videos[0].src//passDesc.textures[0]
        })

        externalTextureBindGroup = passDesc.device.createBindGroup({
          layout: externalLayout,
          entries: [{
            binding: 0,
            resource
          }]
        }) 
      }catch( e ) {
        console.log( e )
        shouldBind = false
      }
    }

    // in case we want a backbuffer etc. eventually this should probably be
    // replaced with a more generic post-processing setup
    let swapChainTexture = null
    if( shouldCopy ) {
      swapChainTexture = passDesc.context.getCurrentTexture()
      renderPassDescriptor.colorAttachments[0].view = swapChainTexture.createView()
    }

    const pass = encoder.beginRenderPass( renderPassDescriptor )
    pass.setPipeline( passDesc.renderPipeline )

    pass.setVertexBuffer( 0, passDesc.vertexBuffer )

    // only switch bindgroups if pingpong is needed
    const bindGroupIndex = passDesc.shouldPingPong === true ? passDesc.step++ % 2 : 0

    pass.setBindGroup( 0, passDesc.renderBindGroups[ bindGroupIndex ] )

    if( useVideo ) { 
      pass.setBindGroup( 1, externalTextureBindGroup ) 
    }
    
    // TODO: generalize to 3d
    pass.draw(passDesc.vertices.length/2, passDesc.count )  
    pass.end()

    if( shouldCopy ) {
      // Copy the rendering results from the swapchain into |backTexture|.
      encoder.copyTextureToTexture(
        { texture: swapChainTexture },
        { texture: backTexture },
        [ seagulls.width, seagulls.height ]
      )
    }


    return passDesc.step
  },

  async init( ) {
    const device = await seagulls.getDevice()

    const [canvas, context, presentationFormat] = seagulls.setupCanvas( device )
    const view = context.getCurrentTexture().createView()

    const instance = Object.create( seagulls.proto )
    Object.assign( instance, { 
      canvas, 
      context, 
      presentationFormat, 
      view, 
      device, 
      computeStep:0,
      renderStep: 0,
      frame:      0,
      times:      1,
      clearColor: [0,0,0,1],
      shouldUseBackBuffer:true,
      width:  seagulls.width,
      height: seagulls.height,
      __blend: false,
      __computeStages: [],
      __textures:null
    })

    return instance
  },

  proto: {
    buffer( v, label='', type='float' ) {
      const usage = v.usage !== undefined ? v.usage : CONSTANTS.defaultStorageFlags
      const __buffer = seagulls.createStorageBuffer( this.device, v, label, usage )

      const buffer = { type:'buffer', buffer:__buffer }
      buffer.clear = ()=> {
        v.fill(0)
        this.device.queue.writeBuffer(
          __buffer, 0, v, 0, v.length * mult 
        )
      }

      buffer.write = ( buffer, readStart=0, writeStart=0, length=-1 ) => {
        this.device.queue.writeBuffer(
          __buffer, 
          readStart, 
          __buffer, 
          writeStart, 
          length === -1 ? __buffer.length * mult : length
        )
      }

      buffer.read = async ( size=null, offset=0 ) => {
        const read = __buffer
        if( size === null ) size = read.size

        await read.mapAsync(
          GPUMapMode.READ,
          offset*4,
          size*4
        )
  
        let data = null
        try{
          const copyArrayBuffer = read.getMappedRange( 0, size*4 )
          data = copyArrayBuffer.slice( 0 )
        }catch(e) {
          read.unmap()
          console.warn( 'error reading buffer with size:', size )
        }
        read.unmap()

        data = new Float32Array( data )

        //console.log( 'returned length:', data.length )
        return data 
      }

      return buffer
    },

    uniform( __value, type='float' ) {
      const value = Array.isArray( __value ) ? __value : [ __value ]
      const buffer = seagulls.createUniformBuffer( this.device, value, type )
      const storage = new Float32Array( value )
      const device = this.device

      if( Array.isArray( __value ) ) {
        buffer.value = {}
        for( let i = 0; i < value.length; i++ ) {
          Object.defineProperty( buffer.value, i, {
            set(v) {
              storage[ i ] = v
              device.queue.writeBuffer( buffer, i*4, storage, i*4, mult )
            },
            get() {
              return storage[ i ]
            }
          })
        }
        Object.defineProperty( buffer, 'value', {
          set(v) {
            storage.set( v )
            // apparently docs are wrong, all arguments are actually in bytes wtf
            // https://developer.mozilla.org/en-US/docs/Web/API/GPUQueue/writeBuffer
            device.queue.writeBuffer( buffer, 0, storage, 0, v.length * mult )
          },
          get() {
            return storage
          }
        })
      }else{
        Object.defineProperty( buffer, 'value', {
          set( v ) {
            storage[ 0 ] = v
            device.queue.writeBuffer( buffer, 0, storage, 0, mult )
          },
          get() {
            return storage[0]
          }
        })
      }

      buffer.type = 'uniform'

      return buffer
    },

    sampler() {
      const sampler = { 
        type:'sampler',
        sampler : this.device.createSampler({
          magFilter: 'linear',
          minFilter: 'linear',
        })
      }
      return sampler
    },

    feedback() {
      const feedback = { 
        type:'feedback'
      }

      return feedback
    },

    video( src ) {
      return { type:'video', src }
    },

    pingpong( a,b ) {
      return { type:'pingpong', a, b }
    },

    storageTexture( tex ) {
      return this.texture( tex, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING, 'storageTexture' )
    },

    texture( tex, usage=GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING, type='texture' ) {
      const texture = seagulls.createTexture( this.device, 'rgba8unorm'/*CONSTANTS.textureFormat/*this.presentationFormat*/, [this.width, this.height], usage )
      texture.src = tex
      this.device.queue.writeTexture(
        { texture }, 
        tex,
        { bytesPerRow: this.width*4, rowsPerImage: this.height }, 
        {width:this.width, height:this.height}
      )

      texture.type = type
      return texture
    },
    
    compute( args ) {
      const pass = {
        type:     'compute',
        device:   this.device,
        data:     null, 
        shader:   args.shader,
        dispatchCount: [1,1,1],
        times:    1,
        step:     0
      }

      Object.assign( pass, args )

      const [ simPipeline, simBindGroups ] = seagulls.createSimulationStage( 
        pass.device,
        pass.shader, 
        pass.data 
      )

      pass.pipeline   = simPipeline
      pass.bindGroups = simBindGroups

      if( pass.data !== null ) {
        pass.shouldPingPong = !!pass.data.reduce( (a,v) => a + (v.type === 'pingpong' ? 1 : 0), 0 )
      }else{
        pass.shouldPingPong = false
      }

      return pass 
    },


    render( args ) {
      const pass = {
        type:   'render',
        device: this.device,
        presentationFormat: this.presentationFormat,
        clearColor: this.clearColor,
        view: this.view,
        step: 0,
        canvas: this.canvas,
        context: this.context,
        data:null,
        shader:null,
        count:1
      }

      Object.assign( pass, args )
     
      if( pass.vertices === undefined ) pass.vertices = CONSTANTS.quadVertices 

      const [renderPipeline, renderBindGroups, vertexBuffer] = seagulls.createRenderStage(
        this.device,
        pass,
        this.presentationFormat
      )

      pass.renderPipeline = renderPipeline
      pass.renderBindGroups = renderBindGroups
      pass.vertexBuffer = vertexBuffer

      if( pass.data !== null ) {
        pass.shouldPingPong = !!pass.data.reduce( (a,v) => a + (v.type === 'pingpong' ? 1 : 0), 0 )
      }else{
        pass.shouldPingPong = false
      }
      
      return pass
    },

    async run( ...passes ) {
      await this.once( ...passes ) 
      window.requestAnimationFrame( ()=> { this.run( ...passes ) })
    },

    copy( src, dst, size=null, offset=0 ) {
      if( size === null ) size = src.buffer.size
      return { src:src.buffer, dst:dst.buffer, size, offset, type:'copy' }
    },

    async once( ...passes ) {
      const encoder = this.device.createCommandEncoder({ label: 'seagulls encoder' })
      for( let pass of passes ) {
        try {
          if( typeof pass.onframe === 'function' ) await pass.onframe()
        } catch(e) {
          console.warn('caught error with onframe for ' + pass.type + ' pass.', e ) 
        }

        if( pass.type === 'render' ) {
          pass.step = seagulls.render( encoder, pass )
        }else if( pass.type === 'compute' ) {
          pass.step = seagulls.pingpong( 
            encoder,
            pass
          )
        }else if( pass.type === 'copy' ) {
          await encoder.copyBufferToBuffer(
            pass.src,    /* source buffer */
            pass.offset, /* source offset */
            pass.dst,    /* destination buffer */
            pass.offset, /* destination offset */
            pass.size    /* size */
          )
        }

        try {
          if( typeof pass.onframeend === 'function' ) await pass.onframeend()
        } catch(e) {
          console.warn('caught error with onframeend for ' + pass.type + ' pass.', e ) 
        }
      }

      this.device.queue.submit([ encoder.finish() ])
    }

  }
}

export default seagulls
