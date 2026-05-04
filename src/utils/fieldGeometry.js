// ── Field dimension ratios (portrait orientation: height = long axis) ──────────
export const FORMAT_DIMS = {
  '11v11': { length: 105, width: 68 },
  '9v9':   { length: 73,  width: 45 },
  '7v7':   { length: 55,  width: 37 },
}

// Returns the pixel rect of the field inside the canvas
export function getFieldRect(canvasW, canvasH, format = '11v11', padding = 28) {
  const dims = FORMAT_DIMS[format] || FORMAT_DIMS['11v11']
  const aspect = dims.width / dims.length   // < 1 (portrait is taller than wide)
  const availW = canvasW - padding * 2
  const availH = canvasH - padding * 2
  let fieldW, fieldH
  if (availW / availH > aspect) {
    fieldH = availH
    fieldW = fieldH * aspect
  } else {
    fieldW = availW
    fieldH = fieldW / aspect
  }
  return {
    x: (canvasW - fieldW) / 2,
    y: (canvasH - fieldH) / 2,
    width:  Math.round(fieldW),
    height: Math.round(fieldH),
  }
}

export const fieldToScreen = (nx, ny, r) => ({ x: r.x + nx * r.width, y: r.y + ny * r.height })
export const screenToField = (sx, sy, r) => ({ x: (sx - r.x) / r.width, y: (sy - r.y) / r.height })
export const isInField = (sx, sy, r) =>
  sx >= r.x && sx <= r.x + r.width && sy >= r.y && sy <= r.y + r.height
export const clampNorm = (v) => Math.max(0.01, Math.min(0.99, v))

// ── Normalised marking coordinates per format ────────────────────────────────
// All fractions: penaltyW = penalty-area width / field width, etc.
export const FIELD_MARKS = {
  '11v11': {
    penaltyW:   40.32 / 68,
    penaltyH:   16.5  / 105,
    goalAreaW:  18.32 / 68,
    goalAreaH:   5.5  / 105,
    goalW:       7.32 / 68,
    goalDepth:   2.44 / 105,
    spotY:      11    / 105,
    circleRY:    9.15 / 105,   // radius as fraction of height
    cornerRX:    1    / 68,    // corner arc radius as fraction of width
    // Penalty arc: portion of 9.15m circle outside the penalty box
    // sin(θ) = (penaltyH − spotY) / circleR → θ ≈ 37°, arc spans 106°
    arcAngle:    106,
    arcRotTop:    37,   // starts 37° past 0° (right), sweeps 106° CW → the bottom bulge
    arcRotBot:   217,   // mirror for bottom penalty area
  },
  '9v9': {
    penaltyW:   29   / 45,
    penaltyH:   12   / 73,
    goalAreaW:  12   / 45,
    goalAreaH:   4   / 73,
    goalW:       5   / 45,
    goalDepth:   2   / 73,
    spotY:       8   / 73,
    circleRY:    7   / 73,
    cornerRX:    1   / 45,
    arcAngle:    110,
    arcRotTop:    35,
    arcRotBot:   215,
  },
  '7v7': {
    penaltyW:   22   / 37,
    penaltyH:   10   / 55,
    goalAreaW:  10   / 37,
    goalAreaH:   3   / 55,
    goalW:       5   / 37,
    goalDepth:   1.8 / 55,
    spotY:       6   / 55,
    circleRY:    0,            // no center circle for small-sided
    cornerRX:    1   / 37,
    arcAngle:    0,
    arcRotTop:   0,
    arcRotBot:   0,
  },
}
