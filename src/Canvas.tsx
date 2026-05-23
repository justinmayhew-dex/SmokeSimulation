// @ts-nocheck
import React, { useState, useEffect } from "react";


import { sleep, cubicBezier } from "./webgl/utils"
import advectVelFS from './webgl/shaders/smoke/advectVel.frag';
import advectDenFS from './webgl/shaders/smoke/advectDen.frag';
import jacobiFS from './webgl/shaders/smoke/jacobi.frag';
import divergenceFS from './webgl/shaders/smoke/divergence.frag';
import debugFS from './webgl/shaders/smoke/debug.frag'
import gradientFS from './webgl/shaders/smoke/gradient.frag'
import curlFS from './webgl/shaders/smoke/curl.frag'
import vorticityFS from './webgl/shaders/smoke/vorticity.frag'
import splatFS from './webgl/shaders/smoke/splat.frag'
import updateVS from './webgl/shaders/update/update.vert'
import advectParFS from './webgl/shaders/smoke/advectPar.frag'
import particleVS from './webgl/shaders/smoke/particles.vert'
import particleFS from './webgl/shaders/smoke/particles.frag'

import { compileShader, makeFloatTexture, makeProgram, prepareProgram, renderProgram, resizeCanvasToDisplaySize } from "./webgl/gl";

const TEX_SIZE = 512
const NUM_PARTICLES = TEX_SIZE * TEX_SIZE

const camera = {
  target: [0, 0, 0],
  distance: 2.8,
  azimuth: 0,
  elevation: -0.85,
  fov: 45 * Math.PI / 180,
  near: 0.4,
  far: 800,
  offset: [0, 0]
};
let viewProj;

function initParams() {
  return {
    camera: {
      target: [0, 0, 0],
      distance: 2.8,
      azimuth: 0,
      elevation: -0.85,
      fov: 45 * Math.PI / 180,
      near: 0.4,
      far: 800,
      offset: [0, 0]
    },
    viewProj: undefined,
    mixT: 1.0,
    mixRate: 0.15,
    ptSize: 3,
    scale: 1,
    ortho: false
  }
}

const quadVerts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

const dt = 0.016
const rdx = 1.0
const halfrdx = 0.5
const alpha = -1.0
const rBeta = 0.25
const mode = 1

const splatRadius = 100
export default function Canvas() {
  useEffect(() => {

    const params = initParams()
    const positionBuffers = initPositionBuffers()

    const { canvas, gl } = setupCanvas()
    params.camera.aspect = canvas.width / canvas.height

    const texVelocityA = makeFloatTexture(gl, TEX_SIZE, positionBuffers.posA)
    const texVelocityB = makeFloatTexture(gl, TEX_SIZE, positionBuffers.posA)
    const texPressureA = makeFloatTexture(gl, TEX_SIZE, positionBuffers.posA)
    const texPressureB = makeFloatTexture(gl, TEX_SIZE, positionBuffers.posA)
    const texDensityA = makeFloatTexture(gl, TEX_SIZE, positionBuffers.posA)
    const texDensityB = makeFloatTexture(gl, TEX_SIZE, positionBuffers.posA)
    const texDivergence = makeFloatTexture(gl, TEX_SIZE, positionBuffers.posA)

    let velocityRead = texVelocityA
    let velocityWrite = texVelocityB
    let densityRead = texDensityA
    let densityWrite = texDensityB
    let jacobiReadPressure = texPressureA
    let jacobiWritePressure = texPressureB

    let velocityReadFBO = gl.createFramebuffer()
    let velocityWriteFBO = gl.createFramebuffer()
    let densityReadFBO = gl.createFramebuffer()
    let densityWriteFBO = gl.createFramebuffer()

    let jacobiReadFBO = gl.createFramebuffer()
    let jacobiWriteFBO = gl.createFramebuffer()

    gl.bindFramebuffer(gl.FRAMEBUFFER, jacobiReadFBO)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, jacobiReadPressure, 0)

    gl.bindFramebuffer(gl.FRAMEBUFFER, jacobiWriteFBO)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, jacobiWritePressure, 0)


    gl.bindFramebuffer(gl.FRAMEBUFFER, velocityReadFBO)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, velocityRead, 0)

    gl.bindFramebuffer(gl.FRAMEBUFFER, velocityWriteFBO)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, velocityWrite, 0)

    gl.bindFramebuffer(gl.FRAMEBUFFER, densityReadFBO)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, densityRead, 0)

    gl.bindFramebuffer(gl.FRAMEBUFFER, densityWriteFBO)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, densityWrite, 0)

    const divergenceFBO = gl.createFramebuffer()

    gl.bindFramebuffer(gl.FRAMEBUFFER, divergenceFBO)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texDivergence, 0)

    const texCurl = makeFloatTexture(gl, TEX_SIZE, positionBuffers.posA)

    const curlFBO = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, curlFBO)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texCurl, 0)


    //let texStart = textures.texA;
    //let texEnd = textures.texB;

    const getTexEnd = () => texEnd


    const advectVelProg = prepareProgram(gl, {
      vs: updateVS,
      fs: advectVelFS,
      getFramebuffer: () => [velocityWriteFBO],
      getRenderTexture: () => velocityWrite,
      mode: gl.TRIANGLE_STRIP,
      count: 4,
      uniforms: [
        { name: 'velocity', shaderVar: 'u_velocity', type: '1i', getValue: () => [velocityRead] },
        { name: 'dt', shaderVar: 'u_dt', type: '1f', getValue: () => [dt] },
        { name: 'rdx', shaderVar: 'u_rdx', type: '1f', getValue: () => [rdx] },
      ],
      attributes: [{
        name: 'aPos',
        shaderVar: 'a_pos',
        size: 2,
        type: gl.FLOAT,
        data: quadVerts
      }]
    })

    const advectDenProg = prepareProgram(gl, {
      vs: updateVS,
      fs: advectDenFS,
      getFramebuffer: () => [densityWriteFBO],
      getRenderTexture: () => densityWrite,
      mode: gl.TRIANGLE_STRIP,
      count: 4,
      uniforms: [
        { name: 'velocity', shaderVar: 'u_velocity', type: '1i', getValue: () => [velocityRead] },
        { name: 'density', shaderVar: 'u_density', type: '1i', getValue: () => [densityRead] },
        { name: 'dt', shaderVar: 'u_dt', type: '1f', getValue: () => [dt] },
        { name: 'rdx', shaderVar: 'u_rdx', type: '1f', getValue: () => [rdx] },
      ],
      attributes: [{
        name: 'aPos',
        shaderVar: 'a_pos',
        size: 2,
        type: gl.FLOAT,
        data: quadVerts
      }]
    })

    const splatVelProg = prepareProgram(gl, {
      vs: updateVS,
      fs: splatFS,
      getFramebuffer: () => [velocityWriteFBO],
      getRenderTexture: () => [velocityWrite],
      mode: gl.TRIANGLE_STRIP,
      count: 4,
      uniforms: [
        { name: 'velocity', shaderVar: 'u_target', type: '1i', getValue: () => [velocityRead] },
        { name: 'point', shaderVar: 'u_point', type: '2fv', getValue: () => [mouseCoords] },
        { name: 'color', shaderVar: 'u_color', type: '3fv', getValue: () => [mouseDirection] },
        { name: 'radius', shaderVar: 'u_radius', type: '1f', getValue: () => [splatRadius] },
        { name: 'aspect', shaderVar: 'u_aspect', type: '1f', getValue: () => [1] },
      ],
      attributes: [{
        name: 'aPos',
        shaderVar: 'a_pos',
        size: 2,
        type: gl.FLOAT,
        data: quadVerts
      }]

    })

    const splatDenProg = prepareProgram(gl, {
      vs: updateVS,
      fs: splatFS,
      getFramebuffer: () => [densityWriteFBO],
      getRenderTexture: () => [densityWrite],
      mode: gl.TRIANGLE_STRIP,
      count: 4,
      uniforms: [
        { name: 'density', shaderVar: 'u_target', type: '1i', getValue: () => [densityRead] },
        { name: 'point', shaderVar: 'u_point', type: '2fv', getValue: () => [mouseCoords] },
        { name: 'color', shaderVar: 'u_color', type: '3fv', getValue: () => [color] },
        { name: 'radius', shaderVar: 'u_radius', type: '1f', getValue: () => [splatRadius] },
        { name: 'aspect', shaderVar: 'u_aspect', type: '1f', getValue: () => [1] },
      ],
      attributes: [{
        name: 'aPos',
        shaderVar: 'a_pos',
        size: 2,
        type: gl.FLOAT,
        data: quadVerts
      }]

    })

    const divergenceProg = prepareProgram(gl, {
      vs: updateVS,
      fs: divergenceFS,
      getFramebuffer: () => [divergenceFBO],
      getRenderTexture: () => texDivergence,
      mode: gl.TRIANGLE_STRIP,
      count: 4,
      uniforms: [
        { name: 'velocityTex', shaderVar: 'u_velocity', type: '1i', getValue: () => [velocityRead] },
        { name: 'halfrdx', shaderVar: 'u_halfrdx', type: '1f', getValue: () => [halfrdx] },
      ],
      attributes: [{
        name: 'aPos',
        shaderVar: 'a_pos',
        size: 2,
        type: gl.FLOAT,
        data: quadVerts
      }]
    })

    const curlProg = prepareProgram(gl, {
      vs: updateVS,
      fs: curlFS,
      getFramebuffer: () => [curlFBO],
      getRenderTexture: () => [texCurl],
      mode: gl.TRIANGLE_STRIP,
      count: 4,
      uniforms: [
        { name: 'velocity', shaderVar: 'u_velocity', type: '1i', getValue: () => [velocityRead] },
        { name: 'halfrdx', shaderVar: 'u_halfrdx', type: '1f', getValue: () => [halfrdx] },
      ],
      attributes: [{
        name: 'aPos',
        shaderVar: 'a_pos',
        size: 2,
        type: gl.FLOAT,
        data: quadVerts
      }]
    })

    const vorticityProg = prepareProgram(gl, {
      vs: updateVS,
      fs: vorticityFS,
      getFramebuffer: () => [velocityWriteFBO],
      getRenderTextue: () => [velocityWrite],
      mode: gl.TRIANGLE_STRIP,
      count: 4,
      uniforms: [
        { name: 'velocity', shaderVar: 'u_velocity', type: '1i', getValue: () => [velocityRead] },
        { name: 'curl', shaderVar: 'u_curl', type: '1i', getValue: () => [texCurl] },
        { name: 'curlstrength', shaderVar: 'u_curl_strength', type: '1f', getValue: () => [0.3] },
        { name: 'rdx', shaderVar: 'u_rdx', type: '1f', getValue: () => [rdx] },
        { name: 'halfrdx', shaderVar: 'u_halfrdx', type: '1f', getValue: () => [halfrdx] },
      ],
      attributes: [{
        name: 'aPos',
        shaderVar: 'a_pos',
        size: 2,
        type: gl.FLOAT,
        data: quadVerts
      }]
    })

    const jacobiProg = prepareProgram(gl, {
      vs: updateVS,
      fs: jacobiFS,
      getFramebuffer: () => [jacobiWriteFBO],
      getRenderTexture: () => jacobiWritePressure,
      mode: gl.TRIANGLE_STRIP,
      count: 4,
      uniforms: [
        { name: 'pressure', shaderVar: 'u_pressure', type: '1i', getValue: () => [jacobiReadPressure] },
        { name: 'divergence', shaderVar: 'u_divergence', type: '1i', getValue: () => [texDivergence] },
        { name: 'alpha', shaderVar: 'u_alpha', type: '1f', getValue: () => [alpha] },
        { name: 'rBeta', shaderVar: 'u_rBeta', type: '1f', getValue: () => [rBeta] },
      ],
      attributes: [{
        name: 'aPos',
        shaderVar: 'a_pos',
        size: 2,
        type: gl.FLOAT,
        data: quadVerts
      }]
    })

    const gradientProg = prepareProgram(gl, {
      vs: updateVS,
      fs: gradientFS,
      getFramebuffer: () => [velocityWriteFBO],
      getRenderTexture: () => velocityWrite,
      mode: gl.TRIANGLE_STRIP,
      count: 4,
      uniforms: [
        { name: 'velocityTex', shaderVar: 'u_velocity', type: '1i', getValue: () => [velocityRead] },
        { name: 'pressure', shaderVar: 'u_pressure', type: '1i', getValue: () => [jacobiReadPressure] },
        { name: 'halfrdx', shaderVar: 'u_halfrdx', type: '1f', getValue: () => [halfrdx] },
      ],
      attributes: [{
        name: 'aPos',
        shaderVar: 'a_pos',
        size: 2,
        type: gl.FLOAT,
        data: quadVerts
      }]
    })

    let debugTex

    const debugProg = prepareProgram(gl, {
      vs: updateVS,
      fs: debugFS,
      mode: gl.TRIANGLE_STRIP,
      count: 4,
      uniforms: [
        { name: 'tex', shaderVar: 'u_tex', type: '1i', getValue: () => [debugTex] },
        { name: 'mode', shaderVar: 'u_mode', type: '1i', getValue: () => [mode] },
      ],
      attributes: [{
        name: 'aPos',
        shaderVar: 'a_pos',
        size: 2,
        type: gl.FLOAT,
        data: quadVerts
      }]

    })

    function swap(a, b) {
      const _ = a
      a = b
      b = _
    }

    // A simple function to fill a texture with a "blob" of data
    function splatInitialData(gl, texture, x, y, r, g, b) {
      const data = new Float32Array(TEX_SIZE * TEX_SIZE * 4);
      data.fill(0.1)
      for (let i = 0; i < TEX_SIZE; i++) {
        for (let j = 0; j < TEX_SIZE; j++) {
          const dx = i - (TEX_SIZE * x);
          const dy = j - (TEX_SIZE * y);
          if (dx * dx + dy * dy < 400) { // 20px radius blob
            const idx = (j * TEX_SIZE + i) * 4;
            data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 1.0;
          }
        }
      }
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, TEX_SIZE, TEX_SIZE, gl.RGBA, gl.FLOAT, data);
    }
    let _
    // Call this once before starting the loop
    splatInitialData(gl, densityRead, 0.5, 0.5, 1.0, 1.0, 1.0); // White smoke in center
    //splatInitialData(gl, texDensityB, 0.5, 0.5, 1.0, 1.0, 1.0); // White smoke in center
    splatInitialData(gl, velocityRead, 0.5, 0.5, 100.0, 100.0, 1.0); // White smoke in center
    let lastMouseX = 0;
    let lastMouseY = 0;


    let useSplat = false

    canvas.addEventListener('mousedown', (e) => {
      useSplat = true
    })

    canvas.addEventListener('mouseup', (e) => {
      useSplat = false
    })

    canvas.addEventListener('mousemove', (e) => {
      const mouseX = TEX_SIZE / canvas.width * e.clientX
      const mouseY = TEX_SIZE - (TEX_SIZE / canvas.height * e.clientY)
      mouseCoords = [mouseX, mouseY]
      mouseDirection = [-(lastMouseX - mouseX) * 20, -(lastMouseY - mouseY) * 20, 0]
      lastMouseX = mouseX
      lastMouseY = mouseY
    })
    let mouseCoords = [101.1, 100.5]
    let mouseDirection = [20, 20, 0]
    let color = [0.1, 0.1, 0.1]
    debugTex = makeFloatTexture(gl, TEX_SIZE, positionBuffers.posA)

    let startTime = performance.now();
    function frame() {
      let elapsed = (performance.now() - startTime) * 0.001; // Seconds

      // Create a shifting RGB triplet
      // We offset the phase (2.0, 4.0) so the R, G, and B don't peak at the same time
      color[0] = Math.sin(elapsed) * 0.5 + 0.5;        // Red
      color[1] = Math.sin(elapsed + 2.0) * 0.5 + 0.5;  // Green
      color[2] = Math.sin(elapsed + 4.0) * 0.5 + 0.5;  // Blue
      if (useSplat) {
        renderProgram(gl, splatVelProg, TEX_SIZE, TEX_SIZE)

        _ = velocityRead
        velocityRead = velocityWrite
        velocityWrite = _

        _ = velocityReadFBO
        velocityReadFBO = velocityWriteFBO
        velocityWriteFBO = _

        renderProgram(gl, splatDenProg, TEX_SIZE, TEX_SIZE)

        _ = densityRead
        densityRead = densityWrite
        densityWrite = _

        _ = densityReadFBO
        densityReadFBO = densityWriteFBO
        densityWriteFBO = _
      }

      renderProgram(gl, advectVelProg, TEX_SIZE, TEX_SIZE)

      _ = velocityRead
      velocityRead = velocityWrite
      velocityWrite = _

      _ = velocityReadFBO
      velocityReadFBO = velocityWriteFBO
      velocityWriteFBO = _

      renderProgram(gl, advectDenProg, TEX_SIZE, TEX_SIZE)

      _ = densityRead
      densityRead = densityWrite
      densityWrite = _

      _ = densityReadFBO
      densityReadFBO = densityWriteFBO
      densityWriteFBO = _

      renderProgram(gl, divergenceProg, TEX_SIZE, TEX_SIZE)

      for (let i = 0; i < 15; i++) {
        renderProgram(gl, jacobiProg, TEX_SIZE, TEX_SIZE)

        _ = jacobiReadPressure
        jacobiReadPressure = jacobiWritePressure
        jacobiWritePressure = _

        _ = jacobiReadFBO
        jacobiReadFBO = jacobiWriteFBO
        jacobiWriteFBO = _
        //swap(jacobiReadPressure, jacobiWritePressure)
        //swap(jacobiReadFBO, jacobiWriteFBO)
      }


      // Now it's safe to write to the FBO that contains that texture

      renderProgram(gl, gradientProg, TEX_SIZE, TEX_SIZE);

      _ = velocityRead
      velocityRead = velocityWrite
      velocityWrite = _

      _ = velocityReadFBO
      velocityReadFBO = velocityWriteFBO
      velocityWriteFBO = _

      _ = jacobiReadPressure
      jacobiReadPressure = jacobiWritePressure
      jacobiWritePressure = _

      _ = jacobiReadFBO
      jacobiReadFBO = jacobiWriteFBO
      jacobiWriteFBO = _

      debugTex = densityRead
      renderProgram(gl, debugProg, canvas.width, canvas.height)


      requestAnimationFrame(frame);

    }

    requestAnimationFrame(frame)
  })

  function debugReadPixels(gl, fbo) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    const pixels = new Float32Array(100)
    gl.readPixels(0, 0, 10, 10, gl.RGBA, gl.FLOAT, pixels)
    console.log(pixels)
  }
  return (
    <div className="exo-2-font w-screen h-screen fixed" style={{ height: '1000vh' }}>
      <canvas id="c" className="z-0 w-full h-full" style={{ width: '100vw', height: '100vh', position: 'fixed' }}></canvas>
    </div>
  );
}

function setupCanvas() {
  const canvas = document.getElementById('c');
  const gl = canvas.getContext('webgl2');
  if (!gl) { alert('WebGL2 not supported'); }
  gl.getExtension('EXT_color_buffer_float');

  const ext = gl.getExtension('OES_texture_float_linear');
  if (!ext) {
    console.error("Linear filtering for float textures not supported!");
  }


  resizeCanvasToDisplaySize(canvas)
  return { canvas, gl }
}

function scatterDisappear(NUM_PARTICLES, positions) {
  for (let i = 0; i < NUM_PARTICLES; i++) {
    const idx = i * 4;
    positions[idx + 0] = (Math.random() - 0.5) * 1
    positions[idx + 1] = (Math.random() - 0.5) * 1
    positions[idx + 2] = (Math.random() - 0.5) * 1
    positions[idx + 3] = 1.0
  }
}

function initPositionBuffers() {
  const posA = new Float32Array(TEX_SIZE * TEX_SIZE * 4);
  for (let i = 0; i < TEX_SIZE * TEX_SIZE; i++) {
    const idx = i * 4;
    posA[idx + 0] = (Math.random() - 0.5) * 6;
    posA[idx + 1] = (Math.random() - 0.5) * 6;
    posA[idx + 2] = (Math.random() - 0.5) * 9;
    posA[idx + 3] = (Math.random() + 0.5 / 2);
  }

  const posB = new Float32Array(posA);
  return { posA, posB }
}

function initTextures(gl, positionBuffers) {
  const texA = makeFloatTexture(gl, TEX_SIZE, positionBuffers.posA);
  const texB = makeFloatTexture(gl, TEX_SIZE, positionBuffers.posB);
  const texC = makeFloatTexture(gl, TEX_SIZE, positionBuffers.posA);
  const texD = makeFloatTexture(gl, TEX_SIZE, positionBuffers.posA);
  const waveTex = makeFloatTexture(gl, TEX_SIZE, positionBuffers.posA);
  return { texA, texB, texC, texD, waveTex }
}

function initFramebuffers(gl) {
  const simFBO = gl.createFramebuffer();
  return { simFBO }
}

