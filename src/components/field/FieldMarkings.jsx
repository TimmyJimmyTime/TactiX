import { Layer, Rect, Line, Circle, Arc } from 'react-konva'
import { FIELD_MARKS } from '../../utils/fieldGeometry'

const THEMES = {
  // Richer, more saturated to match reference screenshot aesthetic
  classic:    { bg: '#1e5c1e', line: '#ffffff', lo: 0.82, lw: 1.8, stripe: 'rgba(0,0,0,0.06)' },
  dark:       { bg: '#0c2010', line: '#ffffff', lo: 0.55, lw: 1.8, stripe: 'rgba(0,0,0,0.12)' },
  whiteboard: { bg: '#f0f0f0', line: '#1a1a1a', lo: 1.00, lw: 1.5, stripe: 'rgba(0,0,0,0.025)' },
}

export default function FieldMarkings({ fieldRect, format = '11v11', theme = 'classic', showGrid = false }) {
  const { x: fx, y: fy, width: fw, height: fh } = fieldRect
  const m = FIELD_MARKS[format] || FIELD_MARKS['11v11']
  const t = THEMES[theme] || THEMES.classic
  const { line: lc, lo, lw } = t

  // Helpers: normalised → px
  const px = (n) => fx + n * fw
  const py = (n) => fy + n * fh
  const pw = (n) => n * fw
  const ph = (n) => n * fh

  const penW = pw(m.penaltyW);  const penX = fx + (fw - penW) / 2
  const penH = ph(m.penaltyH)
  const gaW  = pw(m.goalAreaW); const gaX  = fx + (fw - gaW)  / 2
  const gaH  = ph(m.goalAreaH)
  const glW  = pw(m.goalW);     const glX  = fx + (fw - glW)  / 2
  const glD  = ph(m.goalDepth)
  const spotYtop = py(m.spotY)
  const spotYbot = py(1 - m.spotY)
  const arcR  = ph(m.circleRY)
  const crnR  = pw(m.cornerRX)

  const lp = { stroke: lc, strokeWidth: lw, opacity: lo }

  return (
    <Layer listening={false}>
      {/* ── Background ── */}
      <Rect x={fx} y={fy} width={fw} height={fh} fill={t.bg} />

      {/* Subtle mowed stripes */}
      {Array.from({ length: 10 }).map((_, i) => (
        <Rect
          key={i}
          x={fx} y={fy + (i * fh) / 10}
          width={fw} height={fh / 10}
          fill={i % 2 === 0 ? t.stripe : 'transparent'}
        />
      ))}

      {/* ── Outer touchline (drawn last so it's crisp) ── */}
      <Rect x={fx} y={fy} width={fw} height={fh}
        stroke={lc} strokeWidth={lw * 1.4} fill="transparent" opacity={lo} />

      {/* ── Halfway line ── */}
      <Line points={[fx, fy + fh / 2, fx + fw, fy + fh / 2]} {...lp} />

      {/* ── Centre circle ── */}
      {arcR > 0 && (
        <Circle x={fx + fw / 2} y={fy + fh / 2}
          radius={arcR} stroke={lc} strokeWidth={lw} fill="transparent" opacity={lo} />
      )}

      {/* ── Centre spot ── */}
      <Circle x={fx + fw / 2} y={fy + fh / 2}
        radius={Math.max(2.5, lw * 1.5)} fill={lc} opacity={lo} />

      {/* ── Penalty areas ── */}
      <Rect x={penX} y={fy}           width={penW} height={penH}
        stroke={lc} strokeWidth={lw} fill="transparent" opacity={lo} />
      <Rect x={penX} y={fy + fh - penH} width={penW} height={penH}
        stroke={lc} strokeWidth={lw} fill="transparent" opacity={lo} />

      {/* ── Goal areas ── */}
      <Rect x={gaX}  y={fy}           width={gaW}  height={gaH}
        stroke={lc} strokeWidth={lw} fill="transparent" opacity={lo} />
      <Rect x={gaX}  y={fy + fh - gaH} width={gaW}  height={gaH}
        stroke={lc} strokeWidth={lw} fill="transparent" opacity={lo} />

      {/* ── Goals (extend beyond touchline) ── */}
      <Rect x={glX}  y={fy - glD}     width={glW}  height={glD}
        stroke={lc} strokeWidth={lw} fill="transparent" opacity={lo * 0.7} />
      <Rect x={glX}  y={fy + fh}      width={glW}  height={glD}
        stroke={lc} strokeWidth={lw} fill="transparent" opacity={lo * 0.7} />

      {/* ── Penalty spots ── */}
      <Circle x={fx + fw / 2} y={spotYtop} radius={Math.max(2.5, lw)} fill={lc} opacity={lo} />
      <Circle x={fx + fw / 2} y={spotYbot} radius={Math.max(2.5, lw)} fill={lc} opacity={lo} />

      {/* ── Penalty arcs ── */}
      {m.arcAngle > 0 && arcR > 0 && (
        <>
          <Arc x={fx + fw / 2} y={spotYtop}
            innerRadius={arcR - lw / 2} outerRadius={arcR + lw / 2}
            angle={m.arcAngle} rotation={m.arcRotTop} fill={lc} opacity={lo} />
          <Arc x={fx + fw / 2} y={spotYbot}
            innerRadius={arcR - lw / 2} outerRadius={arcR + lw / 2}
            angle={m.arcAngle} rotation={m.arcRotBot} fill={lc} opacity={lo} />
        </>
      )}

      {/* ── Corner arcs ── */}
      {[
        { x: fx,      y: fy,      rotation: 0   },
        { x: fx + fw, y: fy,      rotation: 90  },
        { x: fx + fw, y: fy + fh, rotation: 180 },
        { x: fx,      y: fy + fh, rotation: 270 },
      ].map((c, i) => (
        <Arc key={i}
          x={c.x} y={c.y}
          innerRadius={crnR - lw / 2} outerRadius={crnR + lw / 2}
          angle={90} rotation={c.rotation}
          fill={lc} opacity={lo} />
      ))}

      {/* ── Optional positioning grid ── */}
      {showGrid && [0.25, 0.5, 0.75].map((n) => (
        <Line key={`gv${n}`}
          points={[px(n), fy, px(n), fy + fh]}
          stroke={lc} strokeWidth={0.75} opacity={lo * 0.3}
          dash={[4, 6]} listening={false} />
      ))}
      {showGrid && [0.2, 0.4, 0.6, 0.8].map((n) => (
        <Line key={`gh${n}`}
          points={[fx, py(n), fx + fw, py(n)]}
          stroke={lc} strokeWidth={0.75} opacity={lo * 0.3}
          dash={[4, 6]} listening={false} />
      ))}
    </Layer>
  )
}
