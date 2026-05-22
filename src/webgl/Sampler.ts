// @ts-nocheck

export class Sampler {
  constructor(num_particles) {
    this.num_particles = num_particles
    this.shapes = []
    this.particleIndex = 0
    this.shapeIndex = 0
    this.totalLength = 0
  }

  addShape(shape, data) {
    if (data.type === 'ellipse') {
      const length = this.calculateCircumference(shape.a, shape.b)
      this.shapes.push({
        center: shape.center,
        a: shape.a,
        b: shape.b,
        length,
        ...data
      })
      this.totalLength += length
      this.assignParticles()
    }
    else {
      const lines = []
      let shapeLength = 0
      for (let i = 0; i < shape.length / 2; i++) {
        const pointA = shape[i * 2]
        const pointB = shape[i * 2 + 1]
        const length = this.getLength(pointA, pointB)
        lines.push({ a: pointA, b: pointB, length })
        shapeLength += length
      }
      this.shapes.push({
        lines,
        length: shapeLength,
        ...data
      })
      this.totalLength += shapeLength
      this.assignParticles()
    }
  }

  calculateCircumference(a, b) {
    const e1 = 3 * (a + b)
    const e2 = ((3 * a) + b) * (a + (3 * b))
    return Math.PI * (e1 - Math.sqrt(e2))
  }

  moveShape(index, x, y) {
    const shape = this.shapes[index];
    for (let i = 0; i < shape.lines.length; i++) {
      const line = shape.lines[i]
      line.a.x += x;
      line.a.y += y;
      line.b.x += x;
      line.b.y += y;
    }
  }

  assignParticles() {
    let startIndex = 0
    for (let i = 0; i < this.shapes.length; i++) {
      const ratio = this.shapes[i].length / this.totalLength
      const shapeParticles = Math.floor(ratio * this.num_particles)
      this.shapes[i].startIndex = startIndex;
      this.shapes[i].endIndex = startIndex + shapeParticles - 1;
      this.shapes[i].particles = shapeParticles;
      startIndex += shapeParticles;
    }
  }
  getLength(pointA, pointB) {
    const dx = pointB.x - pointA.x
    const dy = pointB.y - pointA.y
    const dz = pointB.z - pointA.z

    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
  sample(number, deviation, last = false) {
    if (this.particleIndex > this.shapes[this.shapeIndex].particles) {
      this.shapeIndex = (this.shapeIndex + 1) % this.shapes.length
      this.particleIndex = 0
    }
    this.particleIndex++
    const shape = this.shapes[this.shapeIndex]

    if (shape.type === 'ellipse') {
      return this.sampleEllipse(shape.center.x, shape.center.y, shape.a, shape.b, number, deviation)
    }

    const length = number * shape.length
    let lineStart = 0
    for (let i = 0; i < shape.lines.length; i++) {
      const line = shape.lines[i]
      const lineEnd = lineStart + line.length
      if (length <= lineEnd) {
        return this.interpolate(line, length - lineStart, deviation)
      } else {
        lineStart = lineEnd
      }
    }
    return { x: 0.0, y: 0.0, amplitude: 0 }
  }
  sampleEllipse(cx, cy, a, b, number, deviation) {
    const inputAngle = 2 * Math.PI * number

    const parametricAngle = Math.atan(Math.tan(inputAngle) * a / b);
    const x = a * Math.sign(number - 0.5) * Math.cos(parametricAngle) + cx;
    const y = b * Math.sin(parametricAngle) + cy;

    return {
      x, y, z: 0.0,
    }
  }
  sampleShape(shapeIndex, number, deviation) {
    const shape = this.shapes[shapeIndex]

    if (shape.type === 'ellipse') {
      return this.sampleEllipse(shape.center.x, shape.center.y, shape.a, shape.b, number, deviation)
    }

    const length = number * shape.length
    let lineStart = 0
    for (let i = 0; i < shape.lines.length; i++) {
      const line = shape.lines[i]
      const lineEnd = lineStart + line.length
      if (length <= lineEnd) {
        return this.interpolate(line, length - lineStart, deviation)
      } else {
        lineStart = lineEnd
      }
    }

  }
  interpolate(line, distanceAlongLine, deviation) {
    const mix = distanceAlongLine / line.length
    let dx = line.b.x - line.a.x
    let dy = line.b.y - line.a.y
    let dz = line.b.z - line.a.z

    deviation *= 0.006
    return {
      x: line.a.x + (dx * mix) + deviation,
      y: line.a.y + (dy * mix) + (deviation * 1.8),
      z: line.a.z + (dz * mix) + deviation,
      amplitude: (Math.sin(distanceAlongLine * 10) * 0.1)
    }
  }

  sampleRing(center, radius, thickness, tiltAngle, spinAngle) {
    // random angle around circle
    const theta = Math.random() * Math.PI * 2

    // radial thickness
    const r = radius + (Math.random() - 0.5) * thickness

    // base circle in XY plane
    let x = r * Math.cos(theta)
    let y = r * Math.sin(theta)
    let z = 0

    // --- rotate around X (tilt) ---
    const cosTilt = Math.cos(tiltAngle)
    const sinTilt = Math.sin(tiltAngle)

    let y1 = y * cosTilt - z * sinTilt
    let z1 = y * sinTilt + z * cosTilt
    let x1 = x

    // --- rotate around Y (spin) ---
    const cosSpin = Math.cos(spinAngle)
    const sinSpin = Math.sin(spinAngle)

    let x2 = x1 * cosSpin + z1 * sinSpin
    let z2 = -x1 * sinSpin + z1 * cosSpin
    let y2 = y1

    return {
      x: center.x + x2,
      y: center.y + y2,
      z: center.z + z2
    }
  }

}
