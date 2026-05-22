//@ts-nocheck
import { Sampler } from './Sampler.ts';
import { sleep } from './utils.ts'

class AbortControl {
  constructor() {

  }
}
export async function animateFlowVisual(args) {
  const {
    //cancel,
    NUM_PARTICLES,
    //texStart,
    //texCurrent,
    //texEnd,
    //posStart,
    //posCurrent,
    posEnd,
    //upload,
    //direction,
  } = args

  const sampler = new Sampler(NUM_PARTICLES)

  let abort
  const timeouts = []
  //cancel.then(() => {
  //  abort = true
  //  timeouts.forEach((timeout) => { clearTimeout(timeout) })
  //})

  // Functions to map my hardcoded coords into bounds
  const minX = -1.5
  const maxX = 0.05
  const minY = -0.525
  const maxY = 0.875

  const sizeX = maxX - minX
  const sizeY = maxY - minY

  const bounds = {
    x1: -0.7,
    x2: 0.7,
    y1: -0.7,
    y2: 0.7
  }
  function tx(x) {
    const t = (x - minX) / sizeX
    return bounds.x1 + t * (bounds.x2 - bounds.x1)
  }

  function sx(dx) {
    return dx / sizeX * (bounds.x2 - bounds.x1)
  }

  function ty(y) {
    const t = (y - minY) / sizeY
    return bounds.y1 + t * (bounds.y2 - bounds.y1)
  }

  function sy(dy) {
    return dy / sizeY * (bounds.y2 - bounds.y1)
  }

  function rect(x, y, w, h, z = 0) {
    x = tx(x)
    y = ty(y)
    w = sx(w)
    h = sy(h)

    return [
      { x: x, y: y, z }, { x: x + w, y: y, z },
      { x: x, y: y, z }, { x: x, y: y + h, z },
      { x: x, y: y + h, z }, { x: x + w, y: y + h, z },
      { x: x + w, y: y, z }, { x: x + w, y: y + h, z },
    ];
  }

  function diamond(x, y, w, h, z = 0) {
    x = tx(x)
    y = ty(y)
    w = sx(w)
    h = sy(h)

    return [
      { x: x, y: y + (0.5 * h), z }, { x: x + (w * 0.5), y: y, z },
      { x: x, y: y + (0.5 * h), z }, { x: x + (w * 0.5), y: y + h, z },
      { x: x + (w * 0.5), y: y, z }, { x: x + w, y: y + (h * 0.5), z },
      { x: x + (w * 0.5), y: y + h, z }, { x: x + w, y: y + (h * 0.5), z },
    ];
  }

  function line(x, y, w, h, z = 0) {
    x = tx(x)
    y = ty(y)
    w = sx(w)
    h = sy(h)

    return [{ x: x, y: y, z }, { x: x + w, y: y + h, z }];
  }


  sampler.addShape(rect(-0.80, 0.875, 0.2, -0.1), { end: { x: -0.65, y: 0.65, z: 0.0 }, delay: 2 })
  sampler.addShape(line(-0.7, 0.775, 0, -0.1), { type: 'line', delay: 1 })
  sampler.addShape(rect(-0.80, 0.675, 0.2, -0.1), { end: { x: -0.65, y: 0.65, z: 0.0 }, delay: 2 })
  sampler.addShape(line(-0.7, 0.575, 0, -0.1), { type: 'line', delay: 3 })
  sampler.addShape(diamond(-0.8, 0.475, 0.2, -0.1), { delay: 4 })
  sampler.addShape(line(-0.8, 0.425, -0.4, 0), { type: 'line', delay: 5 })
  sampler.addShape(rect(-1.4, 0.475, 0.2, -0.1), { end: { x: -0.65, y: 0.65, z: 0.0 }, delay: 6 })
  sampler.addShape(line(-1.3, 0.375, 0, -0.1), { type: 'line', delay: 7 })
  sampler.addShape(rect(-1.4, 0.275, 0.2, -0.15), { end: { x: -0.65, y: 0.65, z: 0.0 }, delay: 8 })
  sampler.addShape(line(-1.3, 0.125, 0, -0.05), { type: 'line', delay: 9 })
  sampler.addShape(diamond(-1.4, 0.075, 0.2, -0.1), { delay: 10 })
  sampler.addShape(line(-1.4, 0.025, -0.1, 0), { type: 'line', delay: 11 })
  sampler.addShape(line(-1.5, 0.025, 0, -0.15), { type: 'line', delay: 12 })
  sampler.addShape(line(-1.5, -0.125, 0.1, 0), { type: 'line', delay: 13 })
  sampler.addShape(line(-1.4, -0.125, 0, -0.15), { type: 'line', delay: 14 })
  sampler.addShape(rect(-1.5, -0.275, 0.2, -0.15), { end: { x: -0.65, y: 0.65, z: 0.0 }, delay: 14 })
  sampler.addShape(line(-1.2, 0.025, 0.05, 0), { type: 'line', delay: 11 })
  sampler.addShape(line(-1.15, 0.025, 0, 0.05), { type: 'line', delay: 12 })
  sampler.addShape(line(-1.15, 0.075, 0.05, 0), { type: 'line', delay: 13 })
  sampler.addShape(rect(-1.1, 0.125, 0.2, -0.1), { end: { x: -0.65, y: 0.65, z: 0.0 }, delay: 14 })
  sampler.addShape(line(-1.0, 0.125, 0, 0.5), { type: 'line', delay: 15 })
  sampler.addShape(line(-1.0, 0.625, 0.2, 0), { type: 'line', delay: 16 })
  sampler.addShape(line(-0.6, 0.425, 0.1, 0), { type: 'line', delay: 5 })
  sampler.addShape(rect(-0.5, 0.475, 0.4, -0.1), { end: { x: -0.65, y: 0.65, z: 0.0 }, delay: 6 })
  sampler.addShape(line(-0.3, 0.375, 0, -0.05), { type: 'line', delay: 7 })
  sampler.addShape(line(-0.3, 0.325, -0.1, 0), { type: 'line', delay: 8 })
  sampler.addShape(line(-0.4, 0.325, 0, -0.05), { type: 'line', delay: 9 })
  sampler.addShape(diamond(-0.5, 0.275, 0.2, -0.1), { delay: 10 })
  sampler.addShape(line(-0.3, 0.225, 0.1, 0), { type: 'line', delay: 11 })
  sampler.addShape(rect(-0.2, 0.275, 0.2, -0.1), { end: { x: -0.65, y: 0.65, z: 0.0 }, delay: 12 })
  sampler.addShape(line(0, 0.225, 0.05, 0), { type: 'line', delay: 13 })
  sampler.addShape(line(0.05, 0.225, 0, 0.4), { type: 'line', delay: 14 })
  sampler.addShape(line(0.05, 0.625, -0.655, 0), { type: 'line', delay: 15 })
  sampler.addShape(line(-0.5, 0.225, -0.1, 0), { type: 'line', delay: 11 })
  sampler.addShape(rect(-0.8, 0.275, 0.2, -0.1), { end: { x: -0.65, y: 0.65, z: 0.0 }, delay: 12 })
  sampler.addShape(line(-0.7, 0.175, 0, -0.05), { type: 'line', delay: 13 })
  sampler.addShape(line(-0.7, 0.125, 0.1, 0), { type: 'line', delay: 14 })
  sampler.addShape(line(-0.6, 0.125, 0, -0.05), { type: 'line', delay: 15 })
  sampler.addShape(rect(-0.8, 0.075, 0.4, -0.1), { end: { x: -0.65, y: 0.65, z: 0.0 }, delay: 16 })
  sampler.addShape(line(-0.6, -0.025, 0, -0.025), { type: 'line', delay: 17 })
  sampler.addShape(line(-0.6, -0.05, -0.1, 0), { type: 'line', delay: 18 })
  sampler.addShape(line(-0.7, -0.05, 0, -0.025), { type: 'line', delay: 19 })
  sampler.addShape(rect(-0.8, -0.075, 0.2, -0.1), { end: { x: -0.65, y: 0.65, z: 0.0 }, delay: 20 })
  sampler.addShape(line(-0.7, -0.175, 0, -0.1), { type: 'line', delay: 21 })
  sampler.addShape(diamond(-0.8, -0.275, 0.2, -0.1), { delay: 22 })
  sampler.addShape(line(-0.6, -0.325, 0.15, 0), { type: 'line', delay: 23 })
  sampler.addShape(rect(-0.45, -0.275, 0.2, -0.1), { end: { x: -0.65, y: 0.65, z: 0.0 }, delay: 24 })
  sampler.addShape(line(-0.35, -0.275, 0, 0.4), { type: 'line', delay: 25 })
  sampler.addShape(line(-0.35, 0.125, -0.15, 0), { type: 'line', delay: 26 })
  sampler.addShape(line(-0.5, 0.125, 0, 0.075), { type: 'line', delay: 27 })
  sampler.addShape(line(-0.5, 0.2, -0.1, 0), { type: 'line', delay: 28 })
  sampler.addShape(line(-0.8, -0.325, -0.1, 0), { type: 'line', delay: 23 })
  sampler.addShape(rect(-1.1, -0.275, 0.2, -0.1), { end: { x: -0.65, y: 0.65, z: 0.0 }, delay: 24 })
  sampler.addShape(line(-1.0, -0.375, 0, -0.1), { type: 'line', delay: 25 })
  sampler.addShape(rect(-1.09, -0.475, 0.18, -0.1), { end: { x: -0.65, y: 0.65, z: 0.0 }, delay: 26 })
  sampler.addShape(line(-0.91, -0.525, 0.1, 0), { type: 'line', delay: 27 })
  sampler.addShape(diamond(-0.81, -0.475, 0.2, -0.1), { delay: 28 })
  sampler.addShape(line(-0.71, -0.475, 0, 0.05), { type: 'line', delay: 29 })
  sampler.addShape(line(-0.71, -0.425, -0.15, 0), { type: 'line', delay: 30 })
  sampler.addShape(line(-0.86, -0.425, 0, 0.65), { type: 'line', delay: 31 })
  sampler.addShape(line(-0.86, 0.225, 0.05, 0), { type: 'line', delay: 32 })

  // --- Sampling pass: fill all buffers, record segments ---
  const ranges = []
  let particleIndex = 0

  for (const [shapeIndex, shape] of sampler.shapes.entries()) {
    //if (abort) return
    const shapeParticles = shape.particles
    const start = particleIndex
    const end = start + shapeParticles

    /*
    if (shape.type === 'ellipse') {
      const lineStart = start
      const lineEnd = start + shapeParticles

      for (let i = lineStart; i < lineEnd; i++) {
        const idx = i * 4;
        const sample = sampler.sampleEllipse(shape.center.x, shape.center.y, shape.a, shape.b, Math.random(), 0.2)

        posStart[idx + 0] = shape.center.x;
        posStart[idx + 1] = shape.center.y;
        posStart[idx + 2] = -Math.PI / 2;

        posCurrent[idx + 0] = shape.center.x - shape.a + (Math.random() - 0.5) * 0.02;
        posCurrent[idx + 1] = shape.center.y + (Math.random() - 0.5) * 0.02;
        posCurrent[idx + 2] = 0.0

        const dx = (sample.x - shape.center.x) / shape.a;
        const dy = (sample.y - shape.center.y) / shape.b;
        const targetAngle = Math.atan2(dy, dx);

        posEnd[idx + 0] = shape.a;
        posEnd[idx + 1] = shape.b;
        posEnd[idx + 2] = targetAngle;
        posEnd[idx + 3] = 100.0;

        particleIndex++
      }

      segments.push({
        type: 'ellipse',
        range: [start, end],
      })
      continue
    }
    */
    if (shape.type === 'line') {
      for (let i = start; i < end; i++) {
        const idx = i * 4;
        const sample = sampler.interpolate(shape.lines[0], Math.random() * shape.length, 0)

        /*
        posStart[idx + 0] = direction ? shape.lines[0].b.x : shape.lines[0].a.x
        posStart[idx + 1] = direction ? shape.lines[0].b.y : shape.lines[0].a.y
        posStart[idx + 2] = 0.0

        posCurrent[idx + 0] = shape.lines[0].a.x + (Math.random() - 0.5) * 0.02
        posCurrent[idx + 1] = shape.lines[0].a.y + (Math.random() - 0.5) * 0.02
        posCurrent[idx + 2] = 0.0
        */
        posEnd[idx + 0] = sample.x
        posEnd[idx + 1] = sample.y
        posEnd[idx + 2] = sample.z
        posEnd[idx + 3] = Math.random()

        particleIndex++
      }
      ranges.push([start, end])
      /*
      segments.push({
        type: 'line',
        range: [start, end],
        direction,
        lineA: { x: shape.lines[0].a.x, y: shape.lines[0].a.y },
        lineB: { x: shape.lines[0].b.x, y: shape.lines[0].b.y },
      })
      */
      continue
    }

    // rect / diamond — per-line within shape
    for (let lineIdx = 0; lineIdx < shape.lines.length; lineIdx++) {
      const shapeLine = shape.lines[lineIdx]
      const lineStart = particleIndex
      const lineEnd = particleIndex + Math.floor((shapeLine.length / shape.length) * shapeParticles)

      for (let i = lineStart; i < lineEnd; i++) {
        const idx = i * 4
        const sample = sampler.interpolate(shapeLine, Math.random() * shapeLine.length, 0)

        /*
        posStart[idx + 0] = shapeLine.b.x
        posStart[idx + 1] = shapeLine.b.y
        posStart[idx + 2] = 0.0

        posCurrent[idx + 0] = shapeLine.a.x + (Math.random() - 0.5) * 0.02
        posCurrent[idx + 1] = shapeLine.a.y + (Math.random() - 0.5) * 0.02
        posCurrent[idx + 2] = 0.0
        */
        posEnd[idx + 0] = sample.x
        posEnd[idx + 1] = sample.y
        posEnd[idx + 2] = sample.z
        posEnd[idx + 3] = Math.random()

        particleIndex++
      }
      ranges.push([start, end])

      /*
      segments.push({
        type: 'shape-line',
        range: [lineStart, lineEnd],
        cornerA: { x: shapeLine.a.x, y: shapeLine.a.y },
        cornerB: { x: shapeLine.b.x, y: shapeLine.b.y },
      })
      */
    }
  }

  /*
  // --- Draw pass: all segments appear (origin → interpolated) ---
  for (const seg of segments) {
    if (abort) return

    if (seg.type === 'ellipse') {
      upload({
        range: seg.range,
        forwardUploads: [
          [texEnd, posEnd],
          [texStart, posStart],
          [texCurrent, posCurrent]
        ],
        backwardUploads: [
          [texEnd, posCurrent]
        ]
      })
      continue
    }

    if (seg.type === 'line') {
      if (seg.direction) {
        upload({
          range: seg.range,
          forwardUploads: [
            [texEnd, posStart]
          ],
          backwardUploads: [
            [texEnd, posCurrent]
          ]
        })
      } else {
        upload({
          range: seg.range,
          forwardUploads: [
            [texEnd, posEnd],
            [texCurrent, posCurrent]
          ],
          backwardUploads: [
            [texEnd, posStart]
          ]
        })
      }
      continue
    }

    // shape-line (rect / diamond)
    upload({
      range: seg.range,
      forwardUploads: [
        [texEnd, posEnd],
        [texCurrent, posCurrent]
      ],
      backwardUploads: [
        [texEnd, posStart]
      ]
    })
  }

  // --- Undraw pass: all segments disappear (interpolated → start corner) ---
  for (const seg of segments) {
    if (abort) return

    if (seg.type === 'ellipse') {
      // Ellipses collapse back to center
      upload({
        range: seg.range,
        forwardUploads: [
          [texEnd, posCurrent]
        ],
        backwardUploads: [
          [texEnd, posEnd],
          [texStart, posStart],
          [texCurrent, posCurrent]
        ]
      })
      continue
    }

    if (seg.type === 'line') {
      if (seg.direction) {
        upload({
          range: seg.range,
          forwardUploads: [
            [texEnd, posCurrent]
          ],
          backwardUploads: [
            [texEnd, posStart]
          ]
        })
      } else {
        upload({
          range: seg.range,
          forwardUploads: [
            [texEnd, posStart]
          ],
          backwardUploads: [
            [texEnd, posEnd],
            [texCurrent, posCurrent]
          ]
        })
      }
      continue
    }

    // shape-line (rect / diamond)
    upload({
      range: seg.range,
      forwardUploads: [
        [texEnd, posStart]
      ],
      backwardUploads: [
        [texEnd, posEnd],
        [texCurrent, posCurrent]
      ]
    })
  }
  */
  console.log(ranges, 'IN ANIMS')
  return ranges
}
export async function animateLLMVisual(args) {
  const {
    cancel,
    NUM_PARTICLES,
    /*
    texCurrent,
    posBack,
    posCurrent,
    texture,
    */
    positions,
    //upload
  } = args
  const sampler = new Sampler(NUM_PARTICLES)

  let abort
  //cancel.then(() => abort = true)

  const layers = [6, 5, 8, 4, 7, 10, 5, 4]
  const pPerLine = Math.floor(NUM_PARTICLES / 117)
  const bounds = { x1: -1, x2: 1, y1: -0.6, y2: 0.6 }
  const width = Math.abs(bounds.x1 - bounds.x2)
  const height = Math.abs(bounds.y1 - bounds.y2)

  // Store per-segment data so we can emit undraw uploads in a second pass
  const segments = []
  const posEnd = new Float32Array(positions.length)

  let particleIndex = 0

  // --- Sampling pass: fill buffers and record segment metadata ---
  for (let i = 0; i < layers.length; i++) {
    //if (abort) return
    const layer = layers[i]
    const layerIndex = i
    const x = bounds.x1 + layerIndex * (width / layers.length)

    for (let node = 0; node < layer; node++) {
      //if (abort) return
      const y = bounds.y1 + ((node + 0.5) * height / layer)
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
        const length = sampler.getLength(
          { x, y, z: 0 },
          { x: xNext, y: yNext, z: 0 }
        )

        const startIndex = particleIndex

        for (let p = 0; p < pPerLine; p++) {
          const idx = particleIndex * 4
          const d = length * Math.random()
          const sample = sampler.interpolate(
            { a: { x, y, z: 0 }, b: { x: xNext, y: yNext, z: 0 }, length },
            d,
            0
          )
          /*
          posCurrent[idx + 0] = x + (Math.random() - 0.5) * 0.02
          posCurrent[idx + 1] = y + (Math.random() - 0.5) * 0.02
          posCurrent[idx + 2] = 0.0

          posBack[idx + 0] = x
          posBack[idx + 1] = y
          posBack[idx + 2] = 0.0
          */
          positions[idx + 0] = sample.x
          positions[idx + 1] = sample.y
          positions[idx + 2] = sample.z

          /*
          posEnd[idx + 0] = xNext
          posEnd[idx + 1] = yNext
          posEnd[idx + 2] = 0.0
          */

          particleIndex++
        }
        /*
        segments.push({
          range: [startIndex, particleIndex],
          // Snapshot the interpolated positions for this segment
          // so the second pass can reference them correctly
          mid: positions.slice(startIndex * 4, particleIndex * 4),
          end: posEnd.slice(startIndex * 4, particleIndex * 4),
          back: posBack.slice(startIndex * 4, particleIndex * 4),
          cur: posCurrent.slice(startIndex * 4, particleIndex * 4),
        })
        */
      }
    }
  }

  // --- First pass: emit all DRAW uploads (origin → interpolated) ---
  for (const seg of segments) {
    if (abort) return
    upload({
      range: seg.range,
      forwardUploads: [
        [texture, positions],
        [texCurrent, posCurrent]
      ],
      backwardUploads: [
        [texture, posBack]
      ]
    })
  }

  // --- Second pass: emit all UNDRAW uploads (interpolated → endpoint) ---
  for (const seg of segments) {
    if (abort) return
    upload({
      range: seg.range,
      forwardUploads: [
        [texture, posEnd]
      ],
      backwardUploads: [
        [texture, positions]
      ]
    })
  }
}

export async function animateFieldEffect(positions, NUM_PARTICLES, upload) {
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
        positions[idx + 3] = 1.0
        particleIndex++
      }
    }
  }
  upload(positions)
  //animateToSphere(positions, upload)
}

export async function animateComponentTree(args) {
  const {
    cancel,
    NUM_PARTICLES,
    texStart,
    texCurrent,
    texEnd,
    posStart,
    posCurrent,
    posEnd,
    upload,
  } = args

  const sampler = new Sampler(NUM_PARTICLES)

  let abort
  cancel.then(() => { abort = true })

  // ------------------------------------------------------------------
  // Coordinate helpers — identical pattern to animateFlowVisual
  // ------------------------------------------------------------------

  function rect(x, y, w, h, z = 0) {
    return [
      { x: x, y: y, z }, { x: x + w, y: y, z }, // top
      { x: x, y: y, z }, { x: x, y: y + h, z }, // left
      { x: x, y: y + h, z }, { x: x + w, y: y + h, z }, // bottom
      { x: x + w, y: y, z }, { x: x + w, y: y + h, z }, // right
    ]
  }

  function line(x, y, w, h, z = 0) {
    return [{ x: x, y: y, z }, { x: x + w, y: y + h, z }]
  }

  // ------------------------------------------------------------------
  // Tree layout
  //
  //   Level 0:  App
  //   Level 1:  Layout, Router
  //   Level 2:  Nav, Hero, Sidebar, Footer
  //   Level 3:  Logo, Links, Title, CTA, Widget, Feed
  //
  // Y increases upward. Nodes drawn as rects, edges as lines.
  // ------------------------------------------------------------------

  const NW = 0.20   // node width
  const NH = 0.08   // node height

  // Y positions (top edge of each level's nodes)
  const L0Y = 0.75
  const L1Y = 0.45
  const L2Y = 0.10
  const L3Y = -0.28

  // X centers per level
  const L0X = [0.00]
  const L1X = [-0.55, 0.55]
  const L2X = [-1.10, -0.37, 0.37, 1.10]
  const L3X = [-1.25, -0.80, -0.22, 0.22, 0.72, 1.20]

  // left edge from center x
  const lx = (cx) => cx - NW / 2

  // ------------------------------------------------------------------
  // Add shapes — nodes then edges, delay increases top→down so the
  // tree builds level by level when scrolling forward.
  //
  // line(x, y, w, h) where w/h are deltas, matching flow visual style.
  // ------------------------------------------------------------------

  // Level 0 node
  sampler.addShape(rect(lx(L0X[0]), L0Y, NW, -NH), { delay: 1 })

  // L0 → L1 edges (from bottom-center of L0 node)
  sampler.addShape(line(L0X[0], L0Y - NH, L1X[0] - L0X[0], -(L0Y - NH - L1Y)), { delay: 2 })
  sampler.addShape(line(L0X[0], L0Y - NH, L1X[1] - L0X[0], -(L0Y - NH - L1Y)), { delay: 3 })

  // Level 1 nodes
  sampler.addShape(rect(lx(L1X[0]), L1Y, NW, -NH), { delay: 4 })
  sampler.addShape(rect(lx(L1X[1]), L1Y, NW, -NH), { delay: 5 })

  // L1[0] → L2[0], L2[1] edges
  sampler.addShape(line(L1X[0], L1Y - NH, L2X[0] - L1X[0], -(L1Y - NH - L2Y)), { delay: 6 })
  sampler.addShape(line(L1X[0], L1Y - NH, L2X[1] - L1X[0], -(L1Y - NH - L2Y)), { delay: 7 })

  // L1[1] → L2[2], L2[3] edges
  sampler.addShape(line(L1X[1], L1Y - NH, L2X[2] - L1X[1], -(L1Y - NH - L2Y)), { delay: 6 })
  sampler.addShape(line(L1X[1], L1Y - NH, L2X[3] - L1X[1], -(L1Y - NH - L2Y)), { delay: 7 })

  // Level 2 nodes
  sampler.addShape(rect(lx(L2X[0]), L2Y, NW, -NH), { delay: 8 })
  sampler.addShape(rect(lx(L2X[1]), L2Y, NW, -NH), { delay: 9 })
  sampler.addShape(rect(lx(L2X[2]), L2Y, NW, -NH), { delay: 10 })
  sampler.addShape(rect(lx(L2X[3]), L2Y, NW, -NH), { delay: 11 })

  // L2[0] → L3[0], L3[1]
  sampler.addShape(line(L2X[0], L2Y - NH, L3X[0] - L2X[0], -(L2Y - NH - L3Y)), { delay: 12 })
  sampler.addShape(line(L2X[0], L2Y - NH, L3X[1] - L2X[0], -(L2Y - NH - L3Y)), { delay: 13 })

  // L2[1] → L3[2]
  sampler.addShape(line(L2X[1], L2Y - NH, L3X[2] - L2X[1], -(L2Y - NH - L3Y)), { delay: 12 })

  // L2[2] → L3[3]
  sampler.addShape(line(L2X[2], L2Y - NH, L3X[3] - L2X[2], -(L2Y - NH - L3Y)), { delay: 12 })

  // L2[3] → L3[4], L3[5]
  sampler.addShape(line(L2X[3], L2Y - NH, L3X[4] - L2X[3], -(L2Y - NH - L3Y)), { delay: 12 })
  sampler.addShape(line(L2X[3], L2Y - NH, L3X[5] - L2X[3], -(L2Y - NH - L3Y)), { delay: 13 })

  // Level 3 nodes
  sampler.addShape(rect(lx(L3X[0]), L3Y, NW, -NH), { delay: 14 })
  sampler.addShape(rect(lx(L3X[1]), L3Y, NW, -NH), { delay: 15 })
  sampler.addShape(rect(lx(L3X[2]), L3Y, NW, -NH), { delay: 16 })
  sampler.addShape(rect(lx(L3X[3]), L3Y, NW, -NH), { delay: 17 })
  sampler.addShape(rect(lx(L3X[4]), L3Y, NW, -NH), { delay: 18 })
  sampler.addShape(rect(lx(L3X[5]), L3Y, NW, -NH), { delay: 19 })

  // ------------------------------------------------------------------
  // Sampling pass — fill buffers, record segments
  // Mirrors rect/diamond logic from animateFlowVisual exactly
  // ------------------------------------------------------------------

  const segments = []
  let particleIndex = 0

  for (const [, shape] of sampler.shapes.entries()) {
    if (abort) return

    const shapeParticles = shape.particles
    const start = particleIndex
    const end = start + shapeParticles

    if (shape.type === 'line') {
      // Single-segment line shape
      for (let i = start; i < end; i++) {
        const idx = i * 4
        const sample = sampler.interpolate(
          shape.lines[0],
          Math.random() * shape.length,
          0
        )

        posStart[idx + 0] = shape.lines[0].a.x
        posStart[idx + 1] = shape.lines[0].a.y
        posStart[idx + 2] = 0.0

        posCurrent[idx + 0] = shape.lines[0].a.x + (Math.random() - 0.5) * 0.02
        posCurrent[idx + 1] = shape.lines[0].a.y + (Math.random() - 0.5) * 0.02
        posCurrent[idx + 2] = 0.0

        posEnd[idx + 0] = sample.x
        posEnd[idx + 1] = sample.y
        posEnd[idx + 2] = sample.z

        particleIndex++
      }

      segments.push({ type: 'line', range: [start, end] })
      continue
    }

    // Multi-segment shape (rect) — per sub-line, same as flow visual
    for (let lineIdx = 0; lineIdx < shape.lines.length; lineIdx++) {
      const shapeLine = shape.lines[lineIdx]
      const lineStart = particleIndex
      const lineEnd = particleIndex + Math.floor((shapeLine.length / shape.length) * shapeParticles)

      for (let i = lineStart; i < lineEnd; i++) {
        const idx = i * 4
        const sample = sampler.interpolate(shapeLine, Math.random() * shapeLine.length, 0)

        posStart[idx + 0] = shapeLine.b.x
        posStart[idx + 1] = shapeLine.b.y
        posStart[idx + 2] = 0.0

        posCurrent[idx + 0] = shapeLine.a.x + (Math.random() - 0.5) * 0.02
        posCurrent[idx + 1] = shapeLine.a.y + (Math.random() - 0.5) * 0.02
        posCurrent[idx + 2] = 0.0

        posEnd[idx + 0] = sample.x
        posEnd[idx + 1] = sample.y
        posEnd[idx + 2] = sample.z

        particleIndex++
      }

      segments.push({ type: 'shape-line', range: [lineStart, lineEnd] })
    }
  }

  // ------------------------------------------------------------------
  // Draw pass — origin → interpolated (diagram appears)
  // ------------------------------------------------------------------

  for (const seg of segments) {
    if (abort) return
    upload({
      range: seg.range,
      forwardUploads: [
        [texEnd, posEnd],
        [texCurrent, posCurrent],
      ],
      backwardUploads: [
        [texEnd, posStart],
      ],
    })
  }

  // ------------------------------------------------------------------
  // Undraw pass — interpolated → origin (diagram disappears)
  // ------------------------------------------------------------------

  for (const seg of segments) {
    if (abort) return
    upload({
      range: seg.range,
      forwardUploads: [
        [texEnd, posStart],
      ],
      backwardUploads: [
        [texEnd, posEnd],
        [texCurrent, posCurrent],
      ],
    })
  }

  console.log('componentTree particleIndex', particleIndex)
}

const ORIENTATIONS = {
  front: [1, 2, 3],
  back: [1, 2, -3],
  up: [1, -3, 2],
  down: [1, 3, -2],
};

export function scatterPlane(args) {
  const { NUM_PARTICLES, texEnd, posEnd, orientation } = args
  const map = ORIENTATIONS[orientation]

  for (let i = 0; i < NUM_PARTICLES; i++) {
    const idx = i * 4

    const x = (Math.random() - 0.5) * 2;
    const y = (Math.random()) * 2;
    const z = 3.0;

    const v = [x, y, z];

    posEnd[idx + 0] = v[Math.abs(map[0]) - 1] * Math.sign(map[0]);
    posEnd[idx + 1] = v[Math.abs(map[1]) - 1] * Math.sign(map[1]);
    posEnd[idx + 2] = v[Math.abs(map[2]) - 1] * Math.sign(map[2]);

  }
}
export async function imageToParticleTexture(args) {
  const { url, TEX_SIZE, texEnd, posEnd, texStart, posStart, upload, orientation } = args
  const map = ORIENTATIONS[orientation]
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });

  const aspect = img.naturalWidth / img.naturalHeight;
  const xScale = aspect >= 1 ? 1 : aspect;
  const yScale = aspect >= 1 ? 1 / aspect : 1;

  const canvas = document.createElement("canvas");
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
  const pixels = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE).data;
  let particleIndex = 0
  for (let row = 0; row < TEX_SIZE; row++) {
    for (let col = 0; col < TEX_SIZE; col++) {
      const px = (row * TEX_SIZE + col) * 4;
      const brightness = (pixels[px] * 0.299 + pixels[px + 1] * 0.587 + pixels[px + 2] * 0.114) / 255;
      const idx = (row * TEX_SIZE + col) * 4;

      const x = ((col / (TEX_SIZE - 1)) * 2 - 1) * xScale;
      const y = (1 - (row / (TEX_SIZE - 1)) * 2) * yScale;
      const z = 3.0;

      const v = [x, y, z];

      posStart[idx + 0] = v[Math.abs(map[0]) - 1] * Math.sign(Math.random() * 6);
      posStart[idx + 1] = v[Math.abs(map[1]) - 1] * Math.sign(Math.random() * 6);
      posStart[idx + 2] = v[Math.abs(map[2]) - 1] * Math.sign(Math.random() * 6);

      posEnd[idx + 0] = v[Math.abs(map[0]) - 1] * Math.sign(map[0]);
      posEnd[idx + 1] = v[Math.abs(map[1]) - 1] * Math.sign(map[1]);
      posEnd[idx + 2] = v[Math.abs(map[2]) - 1] * Math.sign(map[2]);
      posEnd[idx + 3] = brightness;

      particleIndex++
    }
  }
  const uploads = []
  for (let i = 1; i < 200; i++) {
    let start = 40000 - (i * 200)
    uploads.push({
      range: [start, start + 200],
      forwardUploads: [texEnd, posEnd],
      backwardUploads: [
      ],
    })

  }
  console.log(uploads)
  return uploads;
}


export const animations = {
  animateFieldEffect,
  animateComponentTree,
  animateFlowVisual,
  animateLLMVisual,
  imageToParticleTexture,
}

