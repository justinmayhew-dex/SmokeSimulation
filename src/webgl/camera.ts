// @ts-nocheck

import { mat4, vec4, vec3 } from 'gl-matrix';


export function animateCamera(camera, targetState, duration) {
  return new Promise((resolve) => {
    const start = performance.now();
    const initial = {
      target: [...camera.target],
      distance: camera.distance,
      azimuth: camera.azimuth,
      elevation: camera.elevation,
      fov: camera.fov,
    };

    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function tick() {
      const elapsed = performance.now() - start;
      const t = easeInOut(Math.min(elapsed / duration, 1));

      camera.distance = initial.distance + (targetState.distance - initial.distance) * t;
      camera.azimuth = initial.azimuth + (targetState.azimuth - initial.azimuth) * t;
      camera.elevation = initial.elevation + (targetState.elevation - initial.elevation) * t;
      if (targetState.fov) {
        camera.fov = initial.fov + (targetState.fov - initial.fov) * t;
      }

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(tick);
  });
}

export function createViewProjMatrix(cam) {
  const { target, distance, azimuth, elevation, fov, aspect, near, far, offset } = cam;

  const cosEl = Math.cos(elevation);
  const sinEl = Math.sin(elevation);
  const sinAz = Math.sin(azimuth);
  const cosAz = Math.cos(azimuth);

  const px = target[0] + distance * cosEl * sinAz;
  const py = target[1] + distance * sinEl;
  const pz = target[2] + distance * cosEl * cosAz;

  const up = [
    -sinEl * sinAz,
    cosEl,
    -sinEl * cosAz
  ];

  const view = mat4.create();
  mat4.lookAt(view, [px, py, pz], target, up);

  const proj = mat4.create();
  mat4.perspective(proj, fov, aspect, near, far);

  const viewProj = mat4.create();
  mat4.multiply(viewProj, proj, view);

  if (offset) {
    viewProj[12] += offset[0];
    viewProj[13] += offset[1];
  }

  return viewProj;
}

export function raycastToXYPlane(mouseClipX, mouseClipY, viewProj) {
  const invVP = mat4.create();
  mat4.invert(invVP, viewProj);

  const nearClip = vec4.fromValues(mouseClipX, mouseClipY, -1, 1);
  const farClip = vec4.fromValues(mouseClipX, mouseClipY, 0, 1);

  const nearW = vec4.create(); vec4.transformMat4(nearW, nearClip, invVP);
  const farW = vec4.create(); vec4.transformMat4(farW, farClip, invVP);

  // perspective divide
  vec4.scale(nearW, nearW, 1 / nearW[3]);
  vec4.scale(farW, farW, 1 / farW[3]);

  const dz = farW[2] - nearW[2];
  if (Math.abs(dz) < 1e-6) return null;

  const t = -nearW[2] / dz;

  return [
    nearW[0] + t * (farW[0] - nearW[0]),
    nearW[1] + t * (farW[1] - nearW[1]),
    0
  ];
}

export function raycastToSphereSurface(mouseClipX, mouseClipY, viewProj, radius = 0.5) {
  const invVP = mat4.create();
  mat4.invert(invVP, viewProj);

  const nearClip = vec4.fromValues(mouseClipX, mouseClipY, -1, 1);
  const farClip = vec4.fromValues(mouseClipX, mouseClipY, 0, 1);

  const nearW = vec4.create(); vec4.transformMat4(nearW, nearClip, invVP);
  const farW = vec4.create(); vec4.transformMat4(farW, farClip, invVP);
  vec4.scale(nearW, nearW, 1 / nearW[3]);
  vec4.scale(farW, farW, 1 / farW[3]);

  // Ray origin and direction
  const ox = nearW[0], oy = nearW[1], oz = nearW[2];
  const dx = farW[0] - ox, dy = farW[1] - oy, dz = farW[2] - oz;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const rx = dx / len, ry = dy / len, rz = dz / len;

  // Sphere centered at origin — solve |origin + t*dir|² = radius²
  const a = rx * rx + ry * ry + rz * rz; // = 1
  const b = 2 * (ox * rx + oy * ry + oz * rz);
  const c = ox * ox + oy * oy + oz * oz - radius * radius;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null; // ray misses sphere

  const t = (-b - Math.sqrt(discriminant)) / (2 * a); // nearest hit
  if (t < 0) return null;

  return [ox + rx * t, oy + ry * t, oz + rz * t];
}

export function updateCameraFromProgress(camera, progress, startState, endState) {
  const t = progress
  const ease = t < 0.5
    ? 2 * t * t
    : -1 + (4 - 2 * t) * t;
  if (startState.target) {
    camera.target = startState.target.map(
      (v, i) => v + (endState.target[i] - v) * ease
    );
  }
  if (startState.distance) {
    camera.distance = startState.distance +
      (endState.distance - startState.distance) * ease;
  }
  if (startState.azimuth !== null) {
    camera.azimuth = startState.azimuth +
      (endState.azimuth - startState.azimuth) * ease;
  }
  if (startState.elevation !== null) {
    camera.elevation = startState.elevation +
      (endState.elevation - startState.elevation) * ease;
  }
  if (endState.fov != null) {
    camera.fov = startState.fov +
      (endState.fov - startState.fov) * ease;
  }
  if (startState.offset && endState.offset) {
    camera.offset = [
      startState.offset[0] + (endState.offset[0] - startState.offset[0]) * ease,
      startState.offset[1] + (endState.offset[1] - startState.offset[1]) * ease
    ]
  }
}
