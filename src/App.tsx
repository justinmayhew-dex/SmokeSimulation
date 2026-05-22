// @ts-nocheck
import React, { useState, useEffect } from "react";


import { animateCamera, createViewProjMatrix, raycastToXYPlane, raycastToSphereSurface } from "./webgl/camera";
import { Sampler } from "./webgl/Sampler";
import { sleep, cubicBezier } from "./webgl/utils"
import Hero from "./Hero";
const camera = {
  target: [0, 0, 0],
  distance: 2.8,
  azimuth: 0,
  elevation: -0.5,
  fov: 45 * Math.PI / 180,
  near: 0.2,
  far: 800
};


async function animateLLMVisual(sampler, positions, upload) {
  animateCamera({
    target: [0, 0, 0],
    distance: 3,
    azimuth: 0,
    elevation: 0.3,
    fov: 45 * Math.PI / 180,
    near: 0.5,
    far: 800
  }, 3500)
  const layers = [6, 5, 8, 4, 7, 10, 5, 4]
  const num_nodes = layers.reduce((a, b) => a + b, 0)
  const pPerNode = Math.floor(NUM_PARTICLES / num_nodes)
  const pPerLine = 200
  const bounds = {
    x1: -0.7,
    x2: 0.7,
    y1: -0.8,
    y2: 0.8,
  }
  const nodes = {}

  const width = Math.abs(bounds.x1 - bounds.x2)
  const height = Math.abs(bounds.y1 - bounds.y2)
  console.log("IT RUNS TWICE?")
  let particleIndex = 0;
  /*layers.forEach(async (layer, layerIndex) => {
    const x = bounds.x1 + layerIndex * (width / layers.length)

    for (let node = 0; node < layer; node++) {
      const y = bounds.y1 + ((node + 0.5) * height / layer)

      // 1. Assign node particles
      for (let p = 0; p < pPerNode; p++) {
        const idx = particleIndex * 4
        positions[idx + 0] = x
        positions[idx + 1] = y
        positions[idx + 2] = 0.0
        particleIndex++
      }
    }
  })*/
  console.log(pPerNode)
  upload()
  particleIndex = 0
  layers.forEach(async (layer, layerIndex) => {
    const x = bounds.x1 + layerIndex * (width / layers.length)

    for (let node = 0; node < layer; node++) {
      const y = bounds.y1 + ((node + 0.5) * height / layer)

      // 1. Assign node particles
      for (let p = 0; p < pPerNode; p++) {
        const idx = particleIndex * 4
        positions[idx + 0] = x
        positions[idx + 1] = y
        positions[idx + 2] = 0.0
        particleIndex++
      }
    }
  })
  upload()
  particleIndex = 0
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i]
    const layerIndex = i
    const x = bounds.x1 + layerIndex * (width / layers.length)

    for (let node = 0; node < layer; node++) {
      let pIndex = 0
      const y = bounds.y1 + ((node + 0.5) * height / layer)

      // 2. Connect to next layer
      if (layerIndex === layers.length - 1) continue

      const nextCount = layers[layerIndex + 1]
      const xNext = bounds.x1 + (layerIndex + 1) * (width / layers.length)

      const t = layer > 1 ? node / (layer - 1) : 0
      const center = t * (nextCount - 1)

      const spread = 1

      for (let o = -spread; o <= spread; o++) {
        const j = Math.round(center) + o
        if (j < 0 || j >= nextCount) continue

        const yNext = bounds.y1 + ((j + 0.5) * height / nextCount)

        // 3. Emit particles along this line
        const length = sampler.getLength(
          { x, y, z: 0 },
          { x: xNext, y: yNext, z: 0 }
        )

        for (let p = 0; p < pPerLine; p++) {
          const idx = (particleIndex + pIndex) * 4
          const d = length * Math.random()
          const sample = sampler.interpolate(
            { a: { x, y, z: 0 }, b: { x: xNext, y: yNext, z: 0 }, length },
            d,
            Math.random()
          )

          positions[idx + 0] = sample.x
          positions[idx + 1] = sample.y
          positions[idx + 2] = sample.z
          pIndex++
        }
      }
      particleIndex += pPerNode
    }
    await sleep(400)
    upload()
  }
  await sleep(400)
  return
}


const NUM_PARTICLES = 200 * 200;

async function animateFlowVisual(sampler, texture, positions, upload) {
  sampler.shapes = []

  const groups = [
    [0, NUM_PARTICLES]
  ]
  /*
  function drawSquare(group, start, end, width) {
    const subGroups = [
      [group[0], Math.floor(group[1] / 2)],
      [Math.floor(group[1] / 2) + 1, group[1]]
    ]
    const length = {
      x: end.x - start.x,
      y: end.y - start.y,
    }
    for (let i = subGroups[0][0]; i < subGroups[0][1]; i++) {
      const idx = i * 4;

    }
  }
  return
  */
  // =======
  // =====================================================
  // HELPERS
  // ============================================================
  function rect(x1, y1, x2, y2, z = 0) {
    return [
      { x: x1, y: y1, z }, { x: x2, y: y1, z }, // top
      { x: x1, y: y2, z }, { x: x2, y: y2, z }, // bottom
      { x: x1, y: y1, z }, { x: x1, y: y2, z }, // left
      { x: x2, y: y1, z }, { x: x2, y: y2, z }, // right
    ];
  }

  function diamond(cx, cy, hw, hh, z = 0) {
    return [
      { x: cx, y: cy + hh, z }, { x: cx + hw, y: cy, z },
      { x: cx + hw, y: cy, z }, { x: cx, y: cy - hh, z },
      { x: cx, y: cy - hh, z }, { x: cx - hw, y: cy, z },
      { x: cx - hw, y: cy, z }, { x: cx, y: cy + hh, z },
    ];
  }

  function line(x1, y1, x2, y2, z = 0) {
    return [{ x: x1, y: y1, z }, { x: x2, y: y2, z }];
  }

  // ============================================================
  // ROW 1 — left to right
  // [  ] → ◇ → [  ] → [  ] → ◇
  // ============================================================

  sampler.addShape(rect(-0.90, 0.75, -0.65, 0.55),
    { end: { x: -0.65, y: 0.65, z: 0.0 } }
  )          // box 1
  sampler.addShape(line(-0.65, 0.65, -0.50, 0.65),
    { end: { x: -0.5, y: 0.65, z: 0.0 } }
  )          // →
  sampler.addShape(diamond(-0.50, 0.65, 0.12, 0.10),
    { end: { x: -0.38, y: 0.65, z: 0.0 } }
  )        // ◇
  sampler.addShape(line(-0.38, 0.65, -0.22, 0.65),
    { end: { x: -0.22, y: 0.65, z: 0.0 } }
  )          // →
  sampler.addShape(rect(-0.22, 0.75, 0.05, 0.55),
    { end: { x: 0.05, y: 0.65, z: 0.0 } }
  )           // box 2
  sampler.addShape(line(0.05, 0.65, 0.20, 0.65),
    { end: { x: 0.2, y: 0.65, z: 0.0 } }
  )            // →
  sampler.addShape(rect(0.20, 0.75, 0.50, 0.55),
    { end: { x: 0.5, y: 0.65, z: 0.0 } }
  )            // box 3
  sampler.addShape(line(0.50, 0.65, 0.65, 0.65),
    { end: { x: 0.65, y: 0.65, z: 0.0 } }
  )            // →
  sampler.addShape(diamond(0.65, 0.65, 0.12, 0.10),
    { end: { x: 0.65, y: 0.55, z: 0.0 } }
  )         // ◇

  // turn: drop down on the right
  sampler.addShape(line(0.65, 0.55, 0.65, 0.25),
    { end: { x: 0.65, y: 0.25, z: 0.0 } }
  )            // ↓

  // ============================================================
  // ROW 2 — right to left
  //          ◇ → [  ] → [  ] → ◇ → [  ]
  // ============================================================

  sampler.addShape(line(0.65, 0.25, 0.50, 0.25),
    { end: { x: 0.25, y: 0.5, z: 0.0 } }
  )            // start →
  sampler.addShape(rect(0.18, 0.35, 0.50, 0.15),
    { end: { x: 0.18, y: 0.25, z: 0.0 } }
  )            // box 4
  sampler.addShape(line(0.18, 0.25, 0.03, 0.25),
    { end: { x: 0.03, y: 0.25, z: 0.0 } }
  )            // →
  sampler.addShape(diamond(0.03, 0.25, 0.12, 0.10),
    { end: { x: -0.09, y: 0.25, z: 0.0 } }
  )         // ◇
  sampler.addShape(line(-0.09, 0.25, -0.24, 0.25),
    { end: { x: -0.24, y: 0.25, z: 0.0 } }
  )          // →
  sampler.addShape(rect(-0.24, 0.35, -0.52, 0.15),
    { end: { x: -0.52, y: 0.25, z: 0.0 } }
  )          // box 5
  sampler.addShape(line(-0.52, 0.25, -0.67, 0.25),
    { end: { x: -0.67, y: 0.25, z: 0.0 } }
  )          // →
  sampler.addShape(rect(-0.67, 0.35, -0.90, 0.15),
    { end: { x: -0.90, y: 0.25, z: 0.0 } }
  )          // box 6

  // turn: drop down on the left
  sampler.addShape(line(-0.90, 0.25, -0.90, -0.05),
    { end: { x: -0.90, y: -0.05, z: 0.0 } }
  )         // ↓

  // ============================================================
  // ROW 3 — left to right
  // [  ] → [  ] → ◇ → [  ] → ◇
  // ============================================================
  /*
  sampler.addShape(line(-0.90, -0.05, -0.75, -0.05))        // start
  sampler.addShape(rect(-0.75, 0.05, -0.48, -0.15))         // box 7
  sampler.addShape(line(-0.48, -0.05, -0.33, -0.05))        // →
  sampler.addShape(diamond(-0.33, -0.05, 0.12, 0.10))       // ◇
  sampler.addShape(line(-0.21, -0.05, -0.05, -0.05))        // →
  sampler.addShape(rect(-0.05, 0.05, 0.22, -0.15))          // box 8
  sampler.addShape(line(0.22, -0.05, 0.37, -0.05))          // →
  sampler.addShape(rect(0.37, 0.05, 0.65, -0.15))           // box 9
  sampler.addShape(line(0.65, -0.05, 0.80, -0.05))          // →
  sampler.addShape(diamond(0.80, -0.05, 0.12, 0.10))        // ◇

  // turn: drop down on the right
  sampler.addShape(line(0.80, -0.15, 0.80, -0.45))          // ↓

  // ============================================================
  // ROW 4 — right to left
  //    [  ] ← ◇ ← [  ] ← [  ]
  // ============================================================

  sampler.addShape(line(0.80, -0.45, 0.65, -0.45))
  sampler.addShape(rect(0.35, -0.35, 0.65, -0.55))          // box 10
  sampler.addShape(line(0.35, -0.45, 0.20, -0.45))
  sampler.addShape(diamond(0.20, -0.45, 0.12, 0.10))        // ◇
  sampler.addShape(line(0.08, -0.45, -0.08, -0.45))
  sampler.addShape(rect(-0.08, -0.35, -0.35, -0.55))        // box 11
  sampler.addShape(line(-0.35, -0.45, -0.50, -0.45))
  sampler.addShape(rect(-0.50, -0.35, -0.90, -0.55))        // box 12

  // turn: drop down on the left
  sampler.addShape(line(-0.90, -0.55, -0.90, -0.80))        // ↓

  // ============================================================
  // ROW 5 — left to right, final row
  // [  ] → ◇ → [  ] → [  ]
  // ============================================================

  sampler.addShape(line(-0.90, -0.80, -0.75, -0.80))
  sampler.addShape(rect(-0.75, -0.70, -0.48, -0.90))        // box 13
  sampler.addShape(line(-0.48, -0.80, -0.33, -0.80))
  sampler.addShape(diamond(-0.33, -0.80, 0.12, 0.10))       // ◇
  sampler.addShape(line(-0.21, -0.80, -0.05, -0.80))
  sampler.addShape(rect(-0.05, -0.70, 0.22, -0.90))         // box 14
  sampler.addShape(line(0.22, -0.80, 0.37, -0.80))
  sampler.addShape(rect(0.37, -0.70, 0.70, -0.90))          // box 15

 */
  console.log(sampler.totalLength, NUM_PARTICLES / sampler.totalLength)
  const lineDensity = NUM_PARTICLES / sampler.totalLength
  let particleIndex = 0;

  for (const [shapeIndex, shape] of sampler.shapes.entries()) {
    const shapeParticles = Math.floor(lineDensity * shape.length)
    const start = particleIndex;
    const end = start + shapeParticles

    //loop over shape particles
    for (let i = start; i < end; i++) {
      const idx = i * 4
      const sample = sampler.sampleShape(shapeIndex, Math.random(), Math.random())
      positions[idx + 0] = sample.x
      positions[idx + 1] = sample.y
    }

    for (let i = end; i < NUM_PARTICLES; i++) {
      const idx = i * 4
      positions[idx + 0] = shape.end.x
      positions[idx + 1] = shape.end.y
    }
    //sample shape
    particleIndex += shapeParticles
    //move remaining particles
    await sleep(300)
    upload()
  }
}

async function animateFieldEffect(positions, upload) {
  const density = 100
  const bounds = [-1, -1, 1, 1]
  const particlesPerPoint = NUM_PARTICLES / (density ** 2)
  const rangeX = (bounds[2] - bounds[0]) / density
  const rangeY = (bounds[3] - bounds[1]) / density
  let particleIndex = 0
  for (let i = 0; i < density; i++) {
    for (let j = 0; j < density; j++) {
      let x = bounds[0] + (i * rangeX)
      if (j % 2) {
        x += rangeX * 0.5;
      }
      const y = bounds[1] + (j * rangeY)
      for (let p = 0; p < particlesPerPoint; p++) {
        const idx = particleIndex * 4
        positions[idx + 0] = x
        positions[idx + 1] = y
        positions[idx + 2] = (Math.random() - 0.5) * 0.001
        particleIndex++
      }
    }
  }
  upload(positions)
  await sleep(2000)
  //animateToSphere(positions, upload)
}

function App() {
  useEffect(() => {
    const TEX_SIZE = Math.ceil(Math.sqrt(NUM_PARTICLES));

    // ── FEATURE FLAGS ─────────────────────────────────────────
    // Toggle either feature by flipping these booleans.
    const ENABLE_TRAILS = false;
    // ─────────────────────────────────────────────────────────

    const posA = new Float32Array(TEX_SIZE * TEX_SIZE * 4);
    const posB = new Float32Array(TEX_SIZE * TEX_SIZE * 4);

    const lines = new Float32Array([
      -0.5, 0.85, 0, -0.5, -0.85, 0,
      -0.3, 0.85, 0, -0.3, -0.85, 0,

    ])
    function initParticles() {
      for (let i = 0; i < TEX_SIZE * TEX_SIZE; i++) {
        const idx = i * 4;
        posA[idx + 0] = (Math.random() - 0.5) * 3;
        posA[idx + 1] = (Math.random() - 0.5) * 3;
        posA[idx + 2] = (Math.random() - 0.5) * 3;
        posA[idx + 3] = (Math.random() + 0.5 / 2);
      }
    }
    initParticles();
    const canvas = document.getElementById('c');
    const gl = canvas.getContext('webgl2');
    if (!gl) { alert('WebGL2 not supported'); }
    gl.getExtension('EXT_color_buffer_float');

    camera.aspect = canvas.width / canvas.height;

    function compileShader(src, type) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    function makeProgram(vs, fs) {
      const p = gl.createProgram();
      gl.attachShader(p, compileShader(vs, gl.VERTEX_SHADER));
      gl.attachShader(p, compileShader(fs, gl.FRAGMENT_SHADER));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(p));
      return p;
    }
    function resizeCanvasToDisplaySize(canvas, multiplier) {
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

    resizeCanvasToDisplaySize(canvas)

    function makeFloatTexture(data) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TEX_SIZE, TEX_SIZE, 0, gl.RGBA, gl.FLOAT, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    }

    const texPosA = makeFloatTexture(posA);
    const texPosB = makeFloatTexture(posB);
    const texPosC = makeFloatTexture(posA);
    const texPosD = makeFloatTexture(posA);
    let texRead = makeFloatTexture(posA);
    let texWrite = makeFloatTexture(posA);

    let texStart = texPosA
    let texEnd = texPosB
    const simFBO = gl.createFramebuffer();
    animateFieldEffect(posB, (positions) => { uploadParticles(texPosB, positions) })
    const waveVS = `#version 300 es
    in vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0, 1);
    }
    `
    const waveFS = `#version 300 es
    precision highp float;
    uniform float u_texSize;
    uniform vec2 u_mousePos;
    uniform float u_time;
    uniform float u_clickTime;

    out vec4 fragColor;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_texSize;
      vec2 center = (u_mousePos + 1.0) / 2.0;

      float dist = distance(uv, center);
      float elapsed = u_time - u_clickTime;

      // Hover blob
      float hoverRadius = 0.05;
      float hover = (1.0 - smoothstep(0.0, hoverRadius, dist)) * 0.05;

      // Expanding ring
      float radius = elapsed * 0.2;
      float ringWidth = 0.05;
      float ring = 1.0 - smoothstep(0.0, ringWidth, abs(dist - radius));
      float fade = 1.0 - smoothstep(0.0, 1.5, elapsed);
      float wave = ring * fade * 0.1;

      float strength = clamp(hover + wave, 0.0, 1.0);
      fragColor = vec4(strength, 0.0, 0.0, 1.0);    
    }`
    const waveProg = makeProgram(waveVS, waveFS)
    const uMousePos = gl.getUniformLocation(waveProg, 'u_mousePos');
    const uTexSizeWave = gl.getUniformLocation(waveProg, 'u_texSize');
    const uViewProjWave = gl.getUniformLocation(waveProg, 'u_viewProj');
    const uClickTime = gl.getUniformLocation(waveProg, 'u_clickTime');
    const uTimeWave = gl.getUniformLocation(waveProg, 'u_time');
    const aPosWave = gl.getAttribLocation(waveProg, 'a_pos');
    gl.enableVertexAttribArray(aPosWave);
    gl.vertexAttribPointer(aPosWave, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const waveSphereVS = `#version 300 es
    in vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0, 1);
    }`
    const waveSphereFS = `#version 300
    precision highp float;
    uniform float u_texSize;
    uniform vec3 u_mousePos;
    uniform float u_time;
    uniform float u_clickTime;
    
    out vec4 fragColor;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_texSize;

      float dist = distance(uv, u_mousePos);
      float elapsed = u_time - u_clickTime;
      
      if (dist < 0.1) {
        
      }

      float strength = clamp(hover + wave, 0.0, 1.0);
      fragColor = vec4(strength, 0.0, 0.0, 1.0);    
    }`

    const waveTex = makeFloatTexture(posA);
    const waveFBO = gl.createFramebuffer();


    // ── UPDATE SHADER ─────────────────────────────────────────
    // VELOCITY COLOR: stores speed in w channel each frame.
    // Remove the `next.w = speed` line and the w-channel comment
    // to disable velocity tracking (also disable in render shader).
    const updateVS = `#version 300 es
    in vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0, 1);
    }`;

    const updateFS = `#version 300 es
    precision highp float;
    uniform sampler2D u_current;
    uniform sampler2D u_posA;
    uniform sampler2D u_posB;
    uniform sampler2D u_wave;
    uniform float     u_mix;
    uniform float     u_mixRate;
    uniform float     u_time;
    uniform float     u_scale;
    uniform float     u_texSize;
    out vec4 fragColor;

    float hash(float n) { return fract(sin(n) * u_time * 0.0001); }
   
    void main() {
      vec2 uv = (floor(gl_FragCoord.xy) + 0.5) / u_texSize;

      vec4 cur    = texture(u_current, uv);
      vec4 start  = texture(u_posA,    uv);
      vec4 end    = texture(u_posB,    uv) * u_scale;

      vec4 next = mix(start, end, u_mix);
      next = mix(cur, next, u_mixRate * start.w);
      vec2 worldUV = next.xy * 0.5 + 0.5; // remap from [-1,1] to [0,1]
      vec4 wave = texture(u_wave, worldUV);
      
      next.z = mix(next.z, next.z + (wave.x * 0.5), 0.05);      
      fragColor = next;
    }`;

    const updateProg = makeProgram(updateVS, updateFS);
    const uCurrent = gl.getUniformLocation(updateProg, 'u_current');
    const uPosA = gl.getUniformLocation(updateProg, 'u_posA');
    const uPosB = gl.getUniformLocation(updateProg, 'u_posB');
    const uWave = gl.getUniformLocation(updateProg, 'u_wave');
    const uMixU = gl.getUniformLocation(updateProg, 'u_mix');
    const uMixRate = gl.getUniformLocation(updateProg, 'u_mixRate');
    const uTimeU = gl.getUniformLocation(updateProg, 'u_time');
    const uScale = gl.getUniformLocation(updateProg, 'u_scale');
    const uTexSizeU = gl.getUniformLocation(updateProg, 'u_texSize');

    const quadVerts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
    const quadVAO = gl.createVertexArray();
    gl.bindVertexArray(quadVAO);
    const aPosUpdate = gl.getAttribLocation(updateProg, 'a_pos');
    gl.enableVertexAttribArray(aPosUpdate);
    gl.vertexAttribPointer(aPosUpdate, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // ── SPHERE SHADER ─────────────────────────────────────────
    const sphereVS = `#version 300 es
    in vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0, 1);
    }`;

    const sphereFS = `#version 300 es
    precision highp float;
    uniform sampler2D u_current;
    uniform float     u_texSize;
    out vec4 fragColor;

   
    const float PI = 3.14159265358979323846;
    
    void main() {
      vec2 uv = (floor(gl_FragCoord.xy) + 0.5) / u_texSize;

      float r = 0.0;
      float phi = 0.0;

      float a = uv.x * 2.0 - 1.0;
      float b = uv.y * 2.0 - 1.0;
      if (a > -b) {
        if (a > b) {
          r = a;
          phi = (PI / 4.0) * (b / a);
        }
        else {
          r = b;
          phi = (PI / 4.0) * (2.0 - (a / b));
        }
      }
      else {
        if (a < b) {
          r = -a;
          phi = (PI / 4.0) * (4.0 + (b / a));
        }
        else {
          r = -b;
          if (b != 0.0) {
            phi = (PI / 4.0) * (6.0 - (a / b));
          }
          else {
            phi = 0.0;
          }
        }
      }
      float u = r * cos(phi);
      float v = r * sin(phi);
      float r2 = length(vec2(u, v));
      r = clamp(abs(r), 0.0, 1.0); // clamp before acos
      float theta = acos(clamp(1.0 - 2.0 * r, -1.0, 1.0));    
      float sinT = sin(theta);
      float cosT = cos(theta);

      vec2 dir = r2 > 0.00001 ? vec2(u, v) / r2 : vec2(0.0);

      float sx = sinT * dir.x;
      float sz = sinT * dir.y;
      float sy = -cosT;
      
      fragColor = vec4(vec3(sx, sy, sz) * 0.5, 1.0);
    }`;

    const sphereProg = makeProgram(sphereVS, sphereFS)
    const uPosSphere = gl.getUniformLocation(sphereProg, 'u_posB');
    const uTexSizeSphere = gl.getUniformLocation(sphereProg, 'u_texSize');

    const sphereFBO = gl.createFramebuffer()

    const aPosSphere = gl.getAttribLocation(sphereProg, 'a_pos');
    gl.enableVertexAttribArray(aPosSphere);
    gl.vertexAttribPointer(aPosSphere, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // ── RENDER SHADER ─────────────────────────────────────────
    // VELOCITY COLOR: reads .w speed channel and blends from
    // cool blue (settled) → white-cyan (fast-moving).
    // To remove: replace the color block with a single constant
    // fragColor = vec4(0.3, 0.75, 1.0, a * 0.85);
    const renderVS = `#version 300 es
    uniform sampler2D u_posTex;
    uniform int       u_texSize;
    uniform float     u_pointSize;
    uniform float     u_time;
    uniform mat4      u_viewProj;
    
    // ── VELOCITY COLOR: pass speed to fragment shader ────────
    out float v_speed;
    out float v_size;  
    // ────────────────────────────────────────────────────────
    
    void main() {
      int size = u_texSize;

      int id = gl_VertexID;

      int col = id % size;
      int row = id / size;      
      
      vec2 uv = (vec2(float(col), float(row)) + 0.5) / float(size);
      vec4 pos = texture(u_posTex, uv);
      
      vec4 projected =  u_viewProj * vec4(pos.xyz, 1.0);
      float pSize = u_pointSize * (1.0 / projected.w) * 1.5;

      // Pass clamped size and a fade to fragment
      v_size = pSize;
      gl_PointSize = pSize; // never below 1px
      
      gl_Position  = projected; 

      // ── VELOCITY COLOR: read speed from w channel ────────
      v_speed = pos.w;
      // ────────────────────────────────────────────────────
    }`;

    const renderFS = `#version 300 es
    precision highp float;

    // ── VELOCITY COLOR: receive speed from vertex shader ────
    in float v_speed;
    in float v_size;
    // ────────────────────────────────────────────────────────

    out vec4 fragColor;

    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0;
      float a = 1.0 - smoothstep(0.6, 1.0, d);

      // Fade opacity as points get tiny instead of aliasing
      float sizeFade = clamp(v_size, 0.0, 1.0);

      float t = clamp(v_speed, 0.0, 1.0);
      // ── VELOCITY COLOR ───────────────────────────────────
      // slow = deep blue, mid = cyan, fast = white-hot
      vec3 slow = vec3(0.1,  0.4,  0.9);   // deep blue   (settled)
      vec3 mid  = vec3(0.3,  0.85, 1.0);   // cyan        (moving)
      vec3 hot  = vec3(1.0,  0.95, 0.85);  // warm white  (fast)
      vec3 col  = t < 0.5
        ? mix(slow, mid, t * 2.0)
        : mix(mid,  hot, (t - 0.5) * 2.0);

      fragColor = vec4(0.2, 0.2, 0.2, a * 0.85 * sizeFade);      
      // ────────────────────────────────────────────────────
    }`;

    const renderProg = makeProgram(renderVS, renderFS);
    const uPosTex = gl.getUniformLocation(renderProg, 'u_posTex');
    const uTimeRender = gl.getUniformLocation(renderProg, 'u_time');
    const uTexSize = gl.getUniformLocation(renderProg, 'u_texSize');
    const uPointSize = gl.getUniformLocation(renderProg, 'u_pointSize');
    const uViewProj = gl.getUniformLocation(renderProg, 'u_viewProj');


    const lineVS = `#version 300 es
    in vec3 aPosition;
    uniform mat4 u_viewProj;
    uniform vec4 uColor;
    out vec4 color;
    void main() {
      gl_Position = vec4(aPosition, 1.0);
      gl_PointSize = 10.0;
      color = uColor;
    }`

    const lineFS = `#version 300 es
    precision mediump float;
    in vec4 color;
    out vec4 fragColor;
    void main() { fragColor = color; }`

    const lineProg = makeProgram(lineVS, lineFS)
    const uColor = gl.getUniformLocation(lineProg, 'uColor')
    const aPosition = gl.getAttribLocation(lineProg, 'aPosition')
    const uViewProjLine = gl.getUniformLocation(lineProg, 'u_viewProj');

    const lineBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, lines, gl.STATIC_DRAW)

    const planeVS = `#version 300 es
      in vec3 a_pos;
      uniform mat4 u_viewProj;
      
      void main() {
        vec4 projected = u_viewProj * vec4(a_pos, 1.0);
        gl_Position = vec4(projected);
      }
    `
    const planeFS = `#version 300 es
      precision mediump float;
      
      out vec4 fragColor;

      void main() {
        fragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `
    const planeProg = makeProgram(planeVS, planeFS);
    const uViewProjPlane = gl.getUniformLocation(planeProg, 'u_viewProj');

    const aPosPlane = gl.getAttribLocation(planeProg, 'a_pos');

    gl.enableVertexAttribArray(aPosPlane)
    gl.vertexAttribPointer(aPosPlane, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const renderVAO = gl.createVertexArray();

    function uploadParticles() {
      gl.bindTexture(gl.TEXTURE_2D, texPosB);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, TEX_SIZE, TEX_SIZE, gl.RGBA, gl.FLOAT, posB);
    }

    let mixT = 1.0;
    let mixRate = 0.05;
    let ptSize = 3;
    let scale = 1;
    let trailStrength = 0.25; // 0 = no trail, 1 = permanent ghost
    let dAzimuth = 0.0
    let dElevation = 0.0
    let ortho = false
    const identity = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
    document.getElementById('camAzimuth').addEventListener('input', e => { camera.azimuth = +e.target.value; });
    document.getElementById('camElevation').addEventListener('input', e => { camera.elevation = +e.target.value; });
    document.getElementById('camDistance').addEventListener('input', e => { camera.distance = +e.target.value; });
    document.getElementById('camFov').addEventListener('input', e => { camera.fov = +e.target.value * Math.PI / 180; });
    document.getElementById('mixT').addEventListener('input', e => { mixT = e.target.value / 100; });
    document.getElementById('ptSize').addEventListener('input', e => { ptSize = +e.target.value; });
    // ── TRAIL: slider wires up to trailStrength ──────────────
    document.getElementById('trailStrength').addEventListener('input', e => { trailStrength = +e.target.value / 100; });
    // ─────────────────────────────────────────────────────────

    let last = performance.now(), frames = 0;
    let startTime = performance.now();

    function frame(now) {
      frames++;
      if (now - last > 1000) {
        document.getElementById('fps').textContent = frames + ' fps';
        frames = 0; last = now;
      }

      const elapsed = now - startTime;
      camera.azimuth += dAzimuth
      camera.elevation += dElevation


      gl.disable(gl.BLEND);

      //camera.azimuth += 0.005
      //camera.elevation += 0.002
      const viewProj = createViewProjMatrix(camera)
      // RENDER WAVE TEXTURE
      renderWave(viewProj)

      // ── 1. UPDATE PASS ────────────────────────────────────
      gl.bindFramebuffer(gl.FRAMEBUFFER, simFBO);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texWrite, 0);
      gl.viewport(0, 0, TEX_SIZE, TEX_SIZE);
      gl.disable(gl.BLEND);
      gl.useProgram(updateProg);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texRead);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texStart);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, texEnd);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, waveTex);
      gl.uniform1i(uCurrent, 0);
      gl.uniform1i(uPosA, 1);
      gl.uniform1i(uPosB, 2);
      gl.uniform1i(uWave, 3);
      gl.uniform1f(uMixU, mixT);
      gl.uniform1f(uMixRate, mixRate);
      gl.uniform1f(uTimeU, elapsed);
      gl.uniform1f(uScale, scale)
      gl.uniform1f(uTexSizeU, TEX_SIZE);
      gl.bindVertexArray(quadVAO);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // ── 2. SWAP ───────────────────────────────────────────
      [texRead, texWrite] = [texWrite, texRead];

      // ── 3. RENDER PASS ────────────────────────────────────
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.enable(gl.BLEND);

      gl.clearColor(0.03, 0.03, 0.07, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // additive for particles


      gl.useProgram(renderProg);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texRead);
      gl.uniform1i(uPosTex, 0);
      gl.uniform1i(uTexSize, TEX_SIZE);
      gl.uniform1f(uPointSize, ptSize);
      gl.uniform1f(uTimeRender, elapsed);
      gl.uniformMatrix4fv(uViewProj, false, ortho ?
        identity : viewProj);
      gl.bindVertexArray(renderVAO);
      gl.drawArrays(gl.POINTS, 0, NUM_PARTICLES);

      gl.useProgram(lineProg)
      gl.uniformMatrix4fv(uViewProjLine, false, viewProj);
      gl.uniform4f(uColor, 0.2, 0.35, 0.4, mixT ** 2);
      gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)
      gl.enableVertexAttribArray(aPosition)
      gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0)
      //gl.drawArrays(gl.LINES, 0, lines.length / 3)
      // Debug: draw a single point at mousePos
      gl.useProgram(lineProg);
      gl.uniform4f(uColor, 1.0, 0.0, 0.0, 1.0); // bright red

      requestAnimationFrame(frame);
    }
    let mousePos = {
      x: 0.2, y: 0.2
    }
    canvas?.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      const viewProj = createViewProjMatrix(camera)
      const worldPos = raycastToXYPlane(x, y, viewProj)
      mousePos.x = worldPos[0];
      mousePos.y = worldPos[1];
      //console.log(x, y,)

    })
    let clickTime = -999; // far in the past so no wave initially

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      const viewProj = createViewProjMatrix(camera);
      const hit = raycastToXYPlane(x, y, viewProj);
      if (hit) {
        mousePos.x = hit[0];
        mousePos.y = hit[1];
        clickTime = performance.now() / 1000; // in seconds
      }
      console.log(raycastToSphereSurface(x, y, viewProj))

    });
    window.addEventListener('scroll', (e) => {
      for (let i = 0; i < scrollFrames.length; i++) {
        if (scrollY >= scrollFrames[i]?.y && scrollY < scrollFrames[i + 1]?.y) {
          const frameA = scrollFrames[i]
          const frameB = scrollFrames[i + 1]
          const frameHeight = frameB.y - frameA.y
          const scrollHeight = scrollY - scrollFrames[i].y
          const progress = scrollHeight / frameHeight;
          updateCameraFromProgress(progress, scrollFrames[i].camera, scrollFrames[i + 1].camera)
          const dMix = frameB.mix - frameA.mix
          texStart = frameA.startTex
          texEnd = frameA.endTex
          mixRate = frameA.mixRate

          ortho = !!frameA.ortho
          ptSize = frameA.ptSize ?? 4.0
          mixT = frameA.mix + (dMix * frameA.ease(progress))
        }
      }
    })
    function updateCameraFromProgress(progress, startState, endState) {
      const t = progress
      const ease = t < 0.5
        ? 2 * t * t
        : -1 + (4 - 2 * t) * t;

      camera.target = startState.target.map(
        (v, i) => v + (endState.target[i] - v) * ease
      );

      camera.distance = startState.distance +
        (endState.distance - startState.distance) * ease;

      camera.azimuth = startState.azimuth +
        (endState.azimuth - startState.azimuth) * ease;

      camera.elevation = startState.elevation +
        (endState.elevation - startState.elevation) * ease;

      if (endState.fov != null) {
        camera.fov = startState.fov +
          (endState.fov - startState.fov) * ease;
      }
    }
    const scrollFrames = [
      {
        y: 0, mix: 1, ease: cubicBezier(0.05, 0, 0.2, 1),
        mixRate: 0.15,
        startTex: texPosA,
        endTex: texPosB,
        camera: {
          target: [0, 0, 0],
          distance: 2.8,
          azimuth: 0,
          elevation: -0.85,
          fov: 45 * Math.PI / 180,
          near: 0.4,
          far: 800
        }
      },
      {
        y: 500, mix: 1, ease: cubicBezier(0.25, 0.1, 0.2, 1),
        mixRate: 0.05,
        startTex: texPosA,
        endTex: texPosB,
        camera: {
          target: [0, 0, 0],
          distance: 4,
          azimuth: 0,
          elevation: -1.2,
          fov: 45 * Math.PI / 180,
          near: 0.2,
          far: 800
        }
      },
      {
        y: 1000,
        mixRate: 0.05,
        startTex: texPosA,
        endTex: texPosC,
        mix: 0.5,
        ease: cubicBezier(0.25, 0.1, 0.2, 1),
        camera: {
          target: [0, 0, 0],
          distance: 4,
          azimuth: -0.3,
          elevation: -0,
          fov: 45 * Math.PI / 180,
          near: 0.2,
          far: 800
        }
      },
      {
        y: 1500,
        mixRate: 0.05,
        dAzimuth: 0.005,
        ortho: true,
        ptSize: 0.5,
        ease: cubicBezier(0.25, 0.1, 0.2, 1),
        startTex: texPosA,  // ← add these
        endTex: texPosD,
        mix: 0.98, camera: {
          target: [0, 0, 0],
          distance: 4,
          azimuth: -2.3,
          elevation: 0,
          fov: 45 * Math.PI / 180,
          near: 0.2,
          far: 800
        }
      },
      {
        y: 2300,
        mixRate: 0.05,
        ease: cubicBezier(0.25, 0.1, 0.2, 1),
        startTex: texPosA,  // ← add these
        endTex: texPosD,
        mix: 1.0, camera: {
          target: [0, 0, 0],
          distance: 2,
          azimuth: -2.3,
          elevation: 0,
          fov: 45 * Math.PI / 180,
          near: 0.2,
          far: 800
        }
      },

    ]
    function renderWave(viewProj) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, waveFBO)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, waveTex, 0);
      gl.viewport(0, 0, TEX_SIZE, TEX_SIZE);
      gl.useProgram(waveProg);
      gl.uniform1f(uTexSizeWave, TEX_SIZE);
      gl.uniform2f(uMousePos, mousePos.x, mousePos.y)
      gl.uniformMatrix4fv(uViewProjWave, false, viewProj);
      gl.uniform1f(uTimeWave, performance.now() / 1000);
      gl.uniform1f(uClickTime, clickTime);
      gl.bindVertexArray(quadVAO);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function renderPlane() {
      const viewProj = createViewProjMatrix(camera)
      gl.clearColor(0.03, 0.03, 0.07, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.BLEND)
      gl.useProgram(planeProg);
      gl.enableVertexAttribArray(aPosPlane);
      gl.uniformMatrix4fv(uViewProjPlane, false, viewProj);
      gl.enableVertexAttribArray(aPosPlane)
      gl.vertexAttribPointer(aPosPlane, 3, gl.FLOAT, false, 0, 0)
      gl.bindVertexArray(quadVAO)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)


      gl.enable(gl.BLEND);
      gl.useProgram(lineProg);
      gl.uniform4f(uColor, 1.0, 0.0, 0.0, 1.0); // bright red

      requestAnimationFrame(renderPlane)
    }

    function renderSphere() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, sphereFBO);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texPosC, 0);
      gl.viewport(0, 0, TEX_SIZE, TEX_SIZE);
      gl.disable(gl.BLEND);
      gl.useProgram(sphereProg);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texPosA);
      gl.uniform1i(uPosSphere, 1);
      gl.uniform1f(uTexSizeSphere, TEX_SIZE);
      gl.bindVertexArray(quadVAO);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    window.renderSphere = renderSphere
    renderSphere()
    function animateTimeLine() {
      sampler.shapes.length = 0

      const viewProj = createViewProjMatrix({
        target: [0, 0, 0],
        distance: 2.8,
        azimuth: 0,
        elevation: 0,
        fov: 45 * Math.PI / 180,
        near: 0.2,
        far: 800
      })
      const timelineElements = Array.from(document.querySelectorAll('.vertical-timeline-element-content'))
      timelineElements.forEach(element => {
        const boundingRect = element.getBoundingClientRect()
        const shape = getClipCoords(boundingRect, viewProj)
        console.log(shape)
        sampler.addShape(shape, {})
      })
      let particleIndex = 0
      for (let i = 0; i < NUM_PARTICLES; i++) {
        const idx = i * 4
        const sample = sampler.sample(Math.random(), Math.random())
        posB[idx + 0] = sample.x
        posB[idx + 1] = sample.y
        posB[idx + 2] = sample.z
      }
      animateCamera({
        target: [0, 0, 0],
        distance: 2.8,
        azimuth: 0,
        elevation: 0,
        fov: 45 * Math.PI / 180,
        near: 0.2,
        far: 800
      }, 1000)
      uploadParticles(texPosD, posB)
    }
    function getClipCoords(boundingRect, viewProj) {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      const x1 = (2 * boundingRect.left / screenWidth) - 1
      const x2 = (2 * boundingRect.right / screenWidth) - 1
      const y1 = -((2 * boundingRect.top / screenHeight) - 1)
      const y2 = -((2 * boundingRect.bottom / screenHeight) - 1)

      return [
        { x: x1, y: y1, z: 0 }, { x: x2, y: y1, z: 0 },
        { x: x1, y: y1, z: 0 }, { x: x1, y: y2, z: 0 },
        { x: x2, y: y1, z: 0 }, { x: x2, y: y2, z: 0 },
        { x: x1, y: y2, z: 0 }, { x: x2, y: y2, z: 0 },
      ]
    }
    window.animateTimeLine = animateTimeLine
    //requestAnimationFrame(renderPlane)
    // requestAnimationFrame(renderWave)
    requestAnimationFrame(frame);
    function uploadParticles(texture, positions) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, TEX_SIZE, TEX_SIZE, gl.RGBA, gl.FLOAT, positions);
    }

    const sampler = new Sampler(NUM_PARTICLES)

    function readTexture(texture, width, height) {
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

      const pixels = new Float32Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, pixels);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(fbo);
      return pixels;
    }

    // usage
    window.debugPosB = () => {
      const data = readTexture(texPosC, TEX_SIZE, TEX_SIZE);
      console.log(data);
    }
    window.animateLLMVisual = () => { animateLLMVisual(sampler, posB, uploadParticles) }
    return () => { };
  }, []);

  return (
    <div className="exo-2-font w-screen" style={{ height: '600vh' }}>
      <canvas id="c" className="z-0" style={{ width: '100vw', height: '100vh', position: 'fixed' }}></canvas>
      <div id="controls" style={{ display: 'none', flexDirection: 'column', position: 'fixed' }}>
        <label>mix t         <input type="range" id="mixT" min="0" max="100" defaultValue="100" /></label>
        <label>point size    <input type="range" id="ptSize" min="1" max="8" defaultValue="2" /></label>
        <label>azimuth       <input type="range" id="camAzimuth" min="-3.14" max="3.14" step="0.01" defaultValue="0" /></label>
        <label>elevation     <input type="range" id="camElevation" min="-1.4" max="1.4" step="0.01" defaultValue="0.2" /></label>
        <label>distance      <input type="range" id="camDistance" min="0.5" max="20" step="0.1" defaultValue="3" /></label>
        <label>fov           <input type="range" id="camFov" min="20" max="120" step="1" defaultValue="60" /></label>
        {/* ── TRAIL: slider added here ── remove with the trail block above */}
        <label>trail         <input type="range" id="trailStrength" min="0" max="60" step="1" defaultValue="25" /></label>
        <span id="fps">-- fps</span>
      </div>
      <Hero />
    </div>
  );
}

export default App;
