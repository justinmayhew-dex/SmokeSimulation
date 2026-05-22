// @ts-nocheck
export function compileShader(gl, src, type) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s));
  return s;
}
export function makeProgram(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compileShader(gl, vs, gl.VERTEX_SHADER));
  gl.attachShader(p, compileShader(gl, fs, gl.FRAGMENT_SHADER));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(p));
  return p;
}
export function resizeCanvasToDisplaySize(canvas, multiplier) {
  multiplier = multiplier || 1;
  const width = Math.floor(canvas.clientWidth * multiplier);
  const height = Math.floor(canvas.clientHeight * multiplier);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true; // size changed
  }
  return false; // size unchanged
}


export function makeFloatTexture(gl, TEX_SIZE, data, filter = undefined) {
  if (!filter) {
    filter = gl.LINEAR
  }
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TEX_SIZE, TEX_SIZE, 0, gl.RGBA, gl.FLOAT, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

interface UniformArg {
  name: string,
  shaderVar: string,
}

interface AttributeArg {
  name: string,
  shaderVar: string,
  size: number,
  type: number,
}

interface ProgramArgs {
  vs: string,
  fs: string,
  uniforms: UniformArg[],
  attributes: AttributeArg[],
}

export function prepareProgram(gl, args: ProgramArgs) {
  const program = {
    getFramebuffer: args.getFramebuffer,
    getRenderTexture: args.getRenderTexture,
    mode: args.mode,
    count: args.count,
  }
  program.program = makeProgram(gl, args.vs, args.fs)


  program.uniforms = {}
  args.uniforms.forEach((uniform) => {
    if (uniform.type) {
      const location = gl.getUniformLocation(program.program, uniform.shaderVar)
      program.uniforms[uniform.name] = {
        name: uniform.name,
        type: uniform.type,
        getValue: uniform.getValue,
        location,
      }
    } else {
      program.uniforms[uniform.name] = gl.getUniformLocation(program.program, uniform.shaderVar)
    }
  })

  program.attributes = {}

  args.attributes.forEach((attribute, index) => {
    if (attribute.data) {
      const vao = gl.createVertexArray()
      gl.bindVertexArray(vao)

      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, attribute.data, gl.STATIC_DRAW)

      const attribLoc = gl.getAttribLocation(program.program, attribute.shaderVar)

      gl.enableVertexAttribArray(attribLoc)
      gl.vertexAttribPointer(attribLoc, attribute.size, attribute.type, false, 0, 0)

      gl.bindVertexArray(null)

      program.attributes[`vao${index}`] = vao
    } else {
      const attribLoc = gl.getAttribLocation(program.program, attribute.shaderVar)
      program.attributes[attribute.name] = attribLoc
      gl.enableVertexAttribArray(attribLoc)
      gl.vertexAttribPointer(attribLoc, attribute.size, attribute.type, false, 0, 0)
      gl.bindVertexArray(null)
    }
  })

  return program
}

export function renderProgram(gl, program, width, height) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, program.getFramebuffer?.()[0] ?? null)

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error("Framebuffer incomplete!");
  }

  gl.viewport(0, 0, width, height)

  gl.useProgram(program.program)

  Object.values(program.uniforms).forEach((uniform, index) => {
    if (uniform.type.startsWith('Matrix')) {
      gl[`uniform${uniform.type}`](uniform.location, false, ...uniform.getValue())
    } else if (uniform.type === '1i' && uniform.name !== 'texSize' && uniform.name !== 'mode' && uniform.name !== 'alpha' && uniform.name !== 'rBeta') {
      gl.activeTexture(gl[`TEXTURE${index}`])
      gl.bindTexture(gl.TEXTURE_2D, uniform.getValue()[0])
      gl.uniform1i(uniform.location, index);
    } else {
      gl[`uniform${uniform.type}`](uniform.location, ...uniform.getValue())
    }
  })

  Object.values(program.attributes).forEach((vao) => {
    gl.bindVertexArray(vao)
  })

  gl.drawArrays(program.mode, 0, program.count)
}
