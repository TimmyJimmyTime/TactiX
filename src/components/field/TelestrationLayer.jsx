import { Layer, Line, Arrow, Rect, Text } from 'react-konva'

const WEIGHTS    = { thin: 2, medium: 3.5, thick: 6 }
const FONT_SIZES = { small: 14, medium: 20, large: 28 }

// ─────────────────────────────────────────────────────────────────────────────
// TeleItem — renders one saved annotation.
// Each Konva shape carries name="tele-{id}" so FieldCanvas can hit-test
// with stage.getIntersection() and erase by name, without any per-shape
// event wiring or eraserProps pattern.
// ─────────────────────────────────────────────────────────────────────────────
function TeleItem({ item, fieldRect }) {
  const { x: fx, y: fy, width: fw, height: fh } = fieldRect
  const toSx = (n) => fx + n * fw
  const toSy = (n) => fy + n * fh

  const pts      = item.points   // flat normalised [x0,y0, x1,y1, …]
  const screenPts = []
  for (let i = 0; i < pts.length; i += 2) {
    screenPts.push(toSx(pts[i]), toSy(pts[i + 1]))
  }

  const lw   = WEIGHTS[item.weight] ?? item.weight ?? 3
  const dash = item.arrowStyle === 'dashed' ? [lw * 3, lw * 2] : undefined
  const col  = item.color || '#ef4444'
  // Shared: large hit stroke makes thin lines easy to click/drag-erase
  const hit  = Math.max(20, lw * 5)
  const n    = `tele-${item.id}`   // name used by getIntersection for erase

  switch (item.type) {

    // ── Run arrow (curved, free-drawn path) ───────────────────────────────
    case 'arrow':
    case 'curved_arrow': {
      if (screenPts.length < 4) return null
      return (
        <Arrow
          name={n}
          points={screenPts}
          tension={0.5}
          stroke={col} strokeWidth={lw}
          fill={col}
          pointerLength={Math.max(10, lw * 4)}
          pointerWidth={Math.max(8, lw * 3.5)}
          dash={dash}
          lineCap="round" lineJoin="round"
          hitStrokeWidth={hit}
        />
      )
    }

    // ── Pass / straight arrow ─────────────────────────────────────────────
    case 'straight_arrow': {
      if (screenPts.length < 4) return null
      return (
        <Arrow
          name={n}
          points={screenPts.slice(0, 4)}
          stroke={col} strokeWidth={lw}
          fill={col}
          pointerLength={Math.max(10, lw * 4)}
          pointerWidth={Math.max(8, lw * 3.5)}
          dash={dash}
          lineCap="round"
          hitStrokeWidth={hit}
        />
      )
    }

    // ── Freehand pencil ───────────────────────────────────────────────────
    case 'freehand': {
      if (screenPts.length < 4) return null
      return (
        <Line
          name={n}
          points={screenPts}
          stroke={col} strokeWidth={lw}
          tension={0.35}
          lineCap="round" lineJoin="round"
          dash={dash}
          hitStrokeWidth={hit}
        />
      )
    }

    // ── Zone rectangle ────────────────────────────────────────────────────
    case 'zone': {
      if (screenPts.length < 4) return null
      const [rx, ry] = screenPts
      const rw = screenPts[2] - screenPts[0]
      const rh = screenPts[3] - screenPts[1]
      return (
        <Rect
          name={n}
          x={Math.min(rx, rx + rw)} y={Math.min(ry, ry + rh)}
          width={Math.abs(rw)} height={Math.abs(rh)}
          fill={col} opacity={item.opacity ?? 0.3}
          stroke={col} strokeWidth={lw}
        />
      )
    }

    // ── Text label ────────────────────────────────────────────────────────
    case 'text': {
      const fs = FONT_SIZES[item.fontSize] ?? item.fontSize ?? 18
      return (
        <Text
          name={n}
          x={toSx(pts[0])} y={toSy(pts[1])}
          text={item.text || ''}
          fontSize={fs}
          fontStyle="bold"
          fill={col}
          shadowColor="rgba(0,0,0,0.7)" shadowBlur={4}
        />
      )
    }

    default: return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// InProgressItem — live preview while the user is actively drawing.
// Not named "tele-*" so the eraser cannot accidentally erase a stroke
// that hasn't been committed yet.
// ─────────────────────────────────────────────────────────────────────────────
function InProgressItem({ item, fieldRect }) {
  if (!item) return null
  const { x: fx, y: fy, width: fw, height: fh } = fieldRect
  const toSx = (n) => fx + n * fw
  const toSy = (n) => fy + n * fh

  const pts   = item.points
  const spPts = []
  for (let i = 0; i < pts.length; i += 2) spPts.push(toSx(pts[i]), toSy(pts[i + 1]))

  const lw   = WEIGHTS[item.weight] ?? item.weight ?? 3
  const col  = item.color || '#ef4444'
  const dash = item.arrowStyle === 'dashed' ? [lw * 3, lw * 2] : undefined
  const ptr  = { pointerLength: Math.max(10, lw * 4), pointerWidth: Math.max(8, lw * 3.5) }

  if (item.type === 'zone' && spPts.length >= 4) {
    const [rx, ry] = spPts
    const rw = spPts[2] - spPts[0]
    const rh = spPts[3] - spPts[1]
    return (
      <Rect
        x={Math.min(rx, rx + rw)} y={Math.min(ry, ry + rh)}
        width={Math.abs(rw)} height={Math.abs(rh)}
        fill={col} opacity={0.22}
        stroke={col} strokeWidth={lw} dash={[lw * 3, lw * 2]}
        listening={false}
      />
    )
  }

  if (item.type === 'freehand' && spPts.length >= 4) {
    return (
      <Line points={spPts} stroke={col} strokeWidth={lw}
        tension={0.35} lineCap="round" lineJoin="round"
        opacity={0.85} listening={false} />
    )
  }

  if (item.type === 'arrow' && spPts.length >= 4) {
    return (
      <Arrow points={spPts} tension={0.5}
        stroke={col} strokeWidth={lw} fill={col} dash={dash}
        {...ptr} lineCap="round" lineJoin="round"
        opacity={0.9} listening={false} />
    )
  }

  if (item.type === 'straight_arrow' && spPts.length >= 4) {
    return (
      <Arrow points={spPts.slice(0, 4)}
        stroke={col} strokeWidth={lw} fill={col} dash={dash}
        {...ptr} lineCap="round"
        opacity={0.9} listening={false} />
    )
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
export default function TelestrationLayer({ fieldRect, items = [], inProgress }) {
  return (
    <Layer>
      {items.map((item) => (
        <TeleItem key={item.id} item={item} fieldRect={fieldRect} />
      ))}
      <InProgressItem item={inProgress} fieldRect={fieldRect} />
    </Layer>
  )
}
