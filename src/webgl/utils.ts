// @ts-nocheck

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function cubicBezier(x1, y1, x2, y2) {
  function sampleCurveX(t) {
    const inv = 1 - t;
    return (
      3 * inv * inv * t * x1 +
      3 * inv * t * t * x2 +
      t * t * t
    );
  }

  function sampleCurveY(t) {
    const inv = 1 - t;
    return (
      3 * inv * inv * t * y1 +
      3 * inv * t * t * y2 +
      t * t * t
    );
  }

  function solveCurveX(x) {
    let t = x;

    for (let i = 0; i < 8; i++) {
      const xEstimate = sampleCurveX(t) - x;

      const derivative =
        3 * (1 - t) * (1 - t) * x1 +
        6 * (1 - t) * t * (x2 - x1) +
        3 * t * t * (1 - x2);

      if (Math.abs(derivative) < 1e-6) break;

      t -= xEstimate / derivative;
    }

    return t;
  }

  return function (x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    const t = solveCurveX(x);
    return sampleCurveY(t);
  };
}
