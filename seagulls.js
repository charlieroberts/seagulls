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
      dstFactor: 'one',
      operation: 'add',
    },
    alpha: {
      srcFactor: 'zero',
      dstFactor: 'one',
      operation: 'add',
    }
  },

  vertex:`@vertex 
fn vs( @location(0) input : vec2f ) ->  @builtin(position) vec4f {
  return vec4f( input, 0., 1.); 
}

`
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

  createTexture( device, format, canvas ) {
    const tex = device.createTexture({
      size: Array.isArray( canvas ) ? canvas : [canvas.width, canvas.height],
      format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    })

    return tex
  },
 
  createQuadBuffer( device, label='quad vertices' ) {
    const buffer = device.createBuffer({
      label,
      size:  CONSTANTS.quadVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    })

    device.queue.writeBuffer( buffer, 0, CONSTANTS.quadVertices )
    
    const vertexBufferLayout = {
      arrayStride: 8,
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

  _createPingPongLayout( device, label='ping-pong', uniformCount=0, bufferCount=0 ) {
    const entries = []
    // very unoptimized... every buffer has max visibility
    // 
    // and every buffer is read/write storage
    for( let i = 0; i < bufferCount; i++ ) {
      const even = i % 2 === 0
      const entry = { binding: i }
      entry.visibility = even 
        ? GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT
        : GPUShaderStage.COMPUTE
      entry.buffer = { type: even ? 'storage' : 'storage' }
      entries.push( entry )
    }

    if( uniformCount !==0 ) {
      entries.forEach( e => {
        e.binding += uniformCount 
      })
      for( let i = 0; i < uniformCount; i++ ) {
        entries.unshift({
          binding:i,
          visibility: GPUShaderStage.COMPUTE,
          // must have this next line even though it is empty
          // otherwise bad bad things happen in Chrome
          // (and apparently it's part of the spec)
          buffer:{}
        })
      }
    }
    const bindGroupLayout = device.createBindGroupLayout({
      label,
      entries
    })

    return bindGroupLayout
  },


  // TODO fix should add buffer
  createRenderLayout( device, label='render', shouldAddBuffer=0, uniforms=null, backBuffer=true, textures=null ) {
    let count = 0
    const entries = [] 

    if( uniforms !== null ) {
      for( let key of Object.keys( Object.getOwnPropertyDescriptors( uniforms ) ) ) {
        entries.push({
          binding:  count++,
          visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
          buffer: { type:'uniform' }
        })
      }
    }

    if( backBuffer ) {
      entries.push({
        binding:count++,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      })
      entries.push({
        binding:count++,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      })
    }

    if( textures !== null ) {
      textures.forEach( tex => {
        entries.push({
          binding:count++,
          visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
          sampler: {}
        })
        if( tex.__type === 'internal' ) {
          entries.push({
            binding:count++,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {}
          })
        }
      })
    }

    if( shouldAddBuffer ) {
      for( let i = 0; i < shouldAddBuffer; i++ ) {
        entries.push({
          binding: count++,
          visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage"} 
        })
      }
    }

    const bindGroupLayout = device.createBindGroupLayout({
      label,
      entries
    })


    return bindGroupLayout
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

  _createPingPongBindGroups( device, layout, buffers, uniform=null, name='pingpong', backBuffer=true, textures=null ) {
    const entriesA = [],
          entriesB = []

    let count = 0 

    
    if( uniform !== null ) {
      for( let key of Object.keys( Object.getOwnPropertyDescriptors( uniform ) ) ) {
        if( key === 'name' || key === 'length' ) continue
        const uni = {
          binding:  count++,
          resource: { buffer: uniform[ key ] }
        }
        entriesA.push( uni )
        entriesB.push( uni )
      }
    }

    if( backBuffer ) {
      const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
      })
      const sampleruni = {
        binding: count++,
        resource: sampler,
      }
      const textureuni = {
        binding: count++,
        resource: backTexture.createView(),
      }

      entriesA.push( sampleruni )
      entriesB.push( sampleruni )
      entriesA.push( textureuni )
      entriesB.push( textureuni )
    }

    if( textures !== null ) {
      textures.forEach( tex => {
        const sampler = device.createSampler({
          magFilter: 'linear',
          minFilter: 'linear'
        })
        const sampleruni = {
          binding: count++,
          resource: sampler
        }
        const textureuni = {
          binding: count++,
          resource: tex.createView()
        }

        entriesA.push( sampleruni )
        entriesB.push( sampleruni )
        entriesA.push( textureuni )
        entriesB.push( textureuni )
      })
    }


    if( buffers !== null ) {
      // for each buffer, if it is a pingpong we need
      // to create an extra entry for it, if it's not
      // a pingpong than the single entry is sufficient.
      // either way, the buffer needs to go into two different
      // bindgroups fed by entriesA and entriesB.
      for( let i = 0; i < buffers.length; i++ ) {
        let buffer = buffers[ i ]

        entriesA.push({
          binding:count,
          resource: { buffer:buffers[i]}
        })

        if( buffer.pingpong === true ) {
          entriesA.push({
            binding:count + 1,
            resource: { buffer:buffers[i+1]}
          })

          entriesB.push({
            binding:count,
            resource: { buffer:buffers[i+1]}
          })
          entriesB.push({
            binding:count + 1,
            resource: { buffer:buffers[i]}
          })

          i+=1 // extra advance!!!!
          count += 2
        }else{
          entriesB.push({
            binding:count,
            resource: { buffer:buffers[i]}
          })
          count += 1
        }
      }
    }

    const bindGroups = [
      device.createBindGroup({
        label:`${name} a`,
        layout,
        entries:entriesA
      }),

      device.createBindGroup({
        label:`${name} b`,
        layout,
        entries: entriesB      
      })
    ]

    return bindGroups
  },
  createRenderPipeline( device, code, presentationFormat, vertexBufferLayout, bindGroupLayout, textures, shouldBlend=false ) {
    const module = device.createShaderModule({
      label: 'main render',
      code
    })

    const bindGroupLayouts = [ bindGroupLayout ]
    const hasExternalTexture = Array.isArray( textures ) 
      ? textures[0] !== null && textures[0].__type === 'external' 
      : false

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

  createRenderStage( device, shader, storage=null, presentationFormat, uniforms=null, textures=null, useBackBuffer=true, useBlend=false ) {
    const [quadBuffer, quadBufferLayout] = seagulls.createQuadBuffer( device )
    //console.log( storage, Object.keys( storage ) )n
    const storageLength = storage === null ? 0 : Object.keys(storage).length

    const renderLayout  = seagulls.createRenderLayout( 
      device, 
      'seagull render layout', 
      storageLength, 
      uniforms, 
      useBackBuffer, 
      textures 
    )

    const bindGroups    = seagulls._createPingPongBindGroups( 
      device, 
      renderLayout, 
      storage, 
      uniforms, 
      'render', 
      useBackBuffer, 
      textures
    )

    const pipeline  = seagulls.createRenderPipeline( device, shader, presentationFormat, quadBufferLayout, renderLayout, textures, useBlend )

    return [ pipeline, bindGroups, quadBuffer ]
  },

  createSimulationStage( device, computeShader, buffers=null, uniforms=null, useBackBuffer=false ) {
    const uniformsLength = uniforms === null || typeof uniforms === 'function' 
      ? 0 
      : Object.keys( Object.getOwnPropertyDescriptors( uniforms ) ).length  

    const pingPongLayout     = seagulls._createPingPongLayout( device, 'ping', uniformsLength, buffers.length )
    const pingPongBindGroups = seagulls._createPingPongBindGroups( 
      device, 
      pingPongLayout, 
      buffers, 
      uniforms,
      'compute',
      useBackBuffer
    )
    const simPipeline        = seagulls.createSimulationPipeline( device, pingPongLayout, computeShader )

    return [ simPipeline, pingPongBindGroups ]
  },

  pingpong( encoder, pipeline, bindgroups, length=1, workgroupCount, idx=0 ) {
    for( let i = 0; i < length; i++ ) {
      const computePass = encoder.beginComputePass()

      computePass.setPipeline( pipeline )
      computePass.setBindGroup( 0, bindgroups[ idx%2 ] ) 

      if( Array.isArray( workgroupCount ) ) {
        computePass.dispatchWorkgroups( workgroupCount[0], workgroupCount[1], workgroupCount[2] )
      }else{
        computePass.dispatchWorkgroups( workgroupCount,workgroupCount,1 )
      }

      idx++
      computePass.end()
    }
    
    return idx
  },

  render( device, encoder, view, clearValue, vertexBuffer, pipeline, bindGroups, count=1, idx=0, context=null, textures=null ) {
    const shouldCopy = context !== null

    const renderPassDescriptor = {
      label: 'render',
      colorAttachments: [{
        view,
        clearValue,
        loadOp:  'clear',
        storeOp: 'store',
      }]
    }

    const externalLayout = device.createBindGroupLayout({
      label:'external layout',
      entries:[{
        binding:0,
        visibility: GPUShaderStage.FRAGMENT,
        externalTexture: {}
      }]
    })
    
    let resource = null, 
        shouldBind = navigator.userAgent.indexOf('Firefox') === -1 && textures !== null && textures[0] !== null && textures[0].__type === 'external' 

    
    let externalTextureBindGroup = null

    if( shouldBind )  {
      try {
        resource = device.importExternalTexture({
          source:textures[0]
        })

        externalTextureBindGroup = device.createBindGroup({
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

    // additional setup.

    // in case we want a backbuffer etc. eventually this should probably be
    // replaced with a more generic post-processing setup
    let swapChainTexture = null
    if( shouldCopy ) {
      swapChainTexture = context.getCurrentTexture()
      renderPassDescriptor.colorAttachments[0].view = swapChainTexture.createView()
    }

    const pass = encoder.beginRenderPass( renderPassDescriptor )
    pass.setPipeline( pipeline )
    pass.setVertexBuffer( 0, vertexBuffer )
    pass.setBindGroup( 0, bindGroups[ idx++ % 2 ] )
    if( shouldBind ) { 
      pass.setBindGroup( 1, externalTextureBindGroup ) 
    }
    pass.draw(6, count)  
    pass.end()

    if( shouldCopy ) {
      // Copy the rendering results from the swapchain into |backTexture|.
      encoder.copyTextureToTexture(
        { texture: swapChainTexture },
        { texture: backTexture },
        [ seagulls.width, seagulls.height]
      )
    }

    device.queue.submit([ encoder.finish() ])

    return idx
  },

  createUniformsManager( device, dict ) {
    const manager = {}
    const values  = Object.values( dict )
    const keys    = Object.keys( dict )

    keys.forEach( (k,i) => {
      const __value = values[ i ]
      const value = Array.isArray( __value ) ? __value : [ __value ]
      const buffer = seagulls.createUniformBuffer( device, value )
      const storage = new Float32Array( value )


      if( Array.isArray( __value ) ) {
        manager[ k ] = buffer
        for( let i = 0; i < value.length; i++ ) {
          Object.defineProperty( buffer, i, {
            set(v) {
              storage[ i ] = v
              device.queue.writeBuffer( buffer, i*4, storage, i*4, mult )
            },
            get() {
              return storage[ i ]
            }
          })
        }
        Object.defineProperty( manager, k, {
          set(v) {
            storage.set( v )
            // apparently docs are wrong, all arguments are actually in bytes wtf
            // https://developer.mozilla.org/en-US/docs/Web/API/GPUQueue/writeBuffer
            device.queue.writeBuffer( buffer, 0, storage, 0, v.length * mult )
          },

          get() {
            return buffer
          }
        })
      }else{
        Object.defineProperty( manager, k, {
          set( v ) {
            storage[ 0 ] = v
            device.queue.writeBuffer( buffer, 0, storage, 0, mult )
          },
          get() {
            return buffer
          }
        })
      }
    })

    return manager
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
    buffers( _buffers ) {
      this.__buffers = {}
      Object.entries(_buffers).forEach( ([k,v]) => {
        const usage = v.usage !== undefined ? v.usage : CONSTANTS.defaultStorageFlags
        this.__buffers[ k ] = seagulls.createStorageBuffer( this.device, v, k, usage )
        this.__buffers[ k ].clear = ()=> {
          v.fill(0)
          this.device.queue.writeBuffer(
            this.__buffers[k], 0, v, 0, v.length * mult 
          )
        }
        this.__buffers[ k ].write = ( buffer, readStart=0, writeStart=0, length=-1 ) => {
          this.device.queue.writeBuffer(
            this.__buffers[k], 
            readStart, 
            buffer, 
            writeStart, 
            length === -1 ? buffer.length * mult : length
          )
        }
      })
      this.buffers = this.__buffers
      return this
    },

    uniforms( _uniforms ) {
      this.uniforms = seagulls.createUniformsManager( this.device, _uniforms )
      return this
    },

    textures( _textures ) {
      this.__textures = _textures.map( tex => {
        const texture = seagulls.createTexture( this.device, this.presentationFormat, [this.width, this.height])
        texture.src = tex
        this.device.queue.writeTexture(
          { texture }, 
          tex,
          { bytesPerRow: 4 * this.width, rowsPerImage: this.height }, 
          {width:this.width, height:this.height}
        )

        return texture
      })

      return this
    },

    backbuffer( use=true ) {
      this.shouldUseBackBuffer = use
      return this
    },

    clear( clearColor ) {
      this.clearColor = clearColor 
      return this
    },

    __formatData( args ) {
      let uniforms = {}
      if( args?.uniforms !== undefined ) {
        for( let u of args.uniforms ) {
          uniforms[ u ] = this.uniforms[ u ]
        }
      }else{
        if( typeof this.uniforms !== 'function' ) {
          for( let u of Object.getOwnPropertyNames( this.uniforms ) ) {
            uniforms[ u ] = this.uniforms[ u ]
          }
        }
      }

      if( Array.isArray( args?.pingpong ) ) {
        args.pingpong.forEach( key => {
          this.__buffers[ key ].pingpong = true
        })
      } 
      
      let buffers = {}
      if( args?.buffers !== undefined ) {
        for( let u of args.buffers ) {
          buffers[ u ] = this.__buffers[ u ]
        }
      }else{
        buffers = this.__buffers        
      }

      let textures = {}
      if( args?.textures !== undefined ) {
        for( let u of args.textures ) {
          textures[ u ] = this.__textures[ u ]
        }
      }else{
        textures = this.__textures
      }

      if( textures !== null ) {
        textures.forEach( t => {
          if( t.nodeName === 'VIDEO' ) {
            t.__type = 'external'
          }else{
            t.__type = 'internal'
          }
        })
      }

      return { buffers, textures, uniforms }
    },

    compute( shader, count=1, args ) {
      const { buffers, textures, uniforms } = this.__formatData( args ) 

      const [ simPipeline, simBindGroups ] = seagulls.createSimulationStage( 
        this.device, 
        shader, 
        Object.values( buffers ), 
        uniforms,
        this.shouldUseBackBuffer,
        textures
      )

      if( args?.workgroupCount !== undefined ) {
        this.workgroupCount = args.workgroupCount
      }else{
        this.workgroupCount = count//Math.round(this.canvas.width / 8)
      }

      this.__computeStages.push({ 
        simPipeline, simBindGroups, step:0, times:this.times, workgroupCount:this.workgroupCount  
      })

      Object.assign( this, { simPipeline, simBindGroups })
     
      return this
    },

    pingpong( times ) {
      this.times = times
      return this
    },

    render( shader, args ) {
      const { buffers, textures, uniforms } = this.__formatData( args )  

      const [ renderPipeline, renderBindGroups, quadBuffer ] = seagulls.createRenderStage( 
        this.device, 
        shader, 
        buffers !== undefined ? Object.values(buffers) : null, 
        this.presentationFormat,
        uniforms,
        textures,
        this.shouldUseBackBuffer,
        this.__blend
      )

      Object.assign( this, { renderPipeline, renderBindGroups, quadBuffer })

      return this
    },

    onframe( fnc ) {
      this.__onframe = fnc 
      return this
    },

    blend( shouldBlend=false ) {
      this.__blend = shouldBlend
      return this
    },

    run( instanceCount = 1, time=null ) {
      const encoder = this.device.createCommandEncoder({ label: 'seagulls encoder' })

      if( typeof this.__onframe === 'function' ) this.__onframe()

      if( this.__computeStages.length > 0 ) {
        for( let stage of this.__computeStages ) {
          stage.step = seagulls.pingpong( 
            encoder, 
            stage.simPipeline, 
            stage.simBindGroups, 
            stage.times, 
            stage.workgroupCount, 
            stage.step
          )
        }
      }

      this.renderStep = seagulls.render( 
        this.device, 
        encoder, 
        this.view,
        this.clearColor, 
        this.quadBuffer, 
        this.renderPipeline, 
        this.renderBindGroups,
        instanceCount,
        this.renderStep,
        this.context,
        this.__textures
      )
      

      if( time === null ) {
        window.requestAnimationFrame( ()=> { this.run( instanceCount ) })
      }else{
        this.timeout = setTimeout( ()=> { this.run( instanceCount, time ) }, time )
      }
    }
  }
}

export default seagulls
