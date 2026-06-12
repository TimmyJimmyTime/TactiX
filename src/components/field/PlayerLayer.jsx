import { Layer, Group, Circle, Rect, Text, Ring } from 'react-konva'

// ── Colour helpers ─────────────────────────────────────────────────────────────
function lightenHex(hex, amount = 0.25) {
  const n = parseInt((hex || '#3b82f6').replace('#', ''), 16)
  const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(255 * amount))
  const g = Math.min(255, ((n >>  8) & 0xff) + Math.round(255 * amount))
  const b = Math.min(255, ( n        & 0xff) + Math.round(255 * amount))
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

function darkenHex(hex, amount = 0.3) {
  const n = parseInt((hex || '#3b82f6').replace('#', ''), 16)
  const r = Math.max(0, ((n >> 16) & 0xff) - Math.round(255 * amount))
  const g = Math.max(0, ((n >>  8) & 0xff) - Math.round(255 * amount))
  const b = Math.max(0, ( n        & 0xff) - Math.round(255 * amount))
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

function textColorFor(hex) {
  const n = parseInt((hex || '#3b82f6').replace('#', ''), 16)
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.55 ? '#000000' : '#ffffff'
}

// ── Player Token ───────────────────────────────────────────────────────────────
function PlayerToken({
  slot, player, team, fieldRect,
  isHighlighted, isDraggable, viewOptions,
  onDragEnd, onClick, onRightClick,
}) {
  const { x: fx, y: fy, width: fw, height: fh } = fieldRect
  const sx = fx + slot.x * fw
  const sy = fy + slot.y * fh
  const r  = Math.max(16, Math.min(27, fh * 0.034))
  const isGK      = slot.label === 'GK'
  const teamColor = team?.color || '#3b82f6'

  const fillColor = isGK ? lightenHex(teamColor, 0.15) : teamColor
  const darkFill  = darkenHex(fillColor, 0.18)
  const txtColor  = textColorFor(fillColor)
  const hasPlayer = !!player

  const lastName = hasPlayer
    ? (player.name.split(' ').at(-1) || player.name).slice(0, 9).toUpperCase()
    : ''
  const numTxt = hasPlayer ? String(player.number ?? '') : ''

  const tokenStroke = txtColor === '#000000' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.95)'
  const strokeW = 2.5

  return (
    <Group
      x={sx} y={sy}
      draggable={isDraggable && hasPlayer}
      onDragEnd={(e) => onDragEnd(slot.id, { x: e.target.x(), y: e.target.y() })}
      onClick={(e) => { e.cancelBubble = true; onClick(slot) }}
      onTap={(e)   => { e.cancelBubble = true; onClick(slot) }}
      onContextMenu={(e) => { e.evt.preventDefault(); e.cancelBubble = true; onRightClick(slot, e) }}
    >
      {isHighlighted && (
        <Circle radius={r + 10} fill="rgba(174,234,0,0.14)" listening={false} />
      )}
      {isHighlighted && (
        <Ring innerRadius={r + 4} outerRadius={r + 7} fill="#AEEA00" opacity={0.9} listening={false} />
      )}

      {!hasPlayer && (
        <Circle
          radius={r}
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth={1.5}
          dash={[5, 5]}
          listening={false}
        />
      )}

      {hasPlayer && (
        isGK ? (
          <Rect
            x={-r} y={-r} width={r * 2} height={r * 2}
            cornerRadius={r * 0.35}
            fill={fillColor}
            stroke={tokenStroke}
            strokeWidth={strokeW}
            shadowColor="rgba(0,0,0,0.75)"
            shadowBlur={14}
            shadowOffsetY={3}
            shadowOpacity={0.8}
          />
        ) : (
          <Circle
            radius={r}
            fill={fillColor}
            stroke={tokenStroke}
            strokeWidth={strokeW}
            shadowColor="rgba(0,0,0,0.75)"
            shadowBlur={14}
            shadowOffsetY={3}
            shadowOpacity={0.8}
          />
        )
      )}

      {hasPlayer && numTxt !== '' && viewOptions.showNumbers !== false && (
        <Text
          text={numTxt}
          x={-r} y={numTxt.length > 1 ? -r * 0.56 : -r * 0.54}
          width={r * 2} align="center"
          fontSize={Math.max(13, r * (numTxt.length > 1 ? 0.82 : 0.92))}
          fontStyle="700"
          fontFamily="Inter, system-ui, sans-serif"
          fill={txtColor}
          listening={false}
        />
      )}

      {!hasPlayer && slot.label && (
        <Text
          text={slot.label}
          x={-r} y={-r * 0.45}
          width={r * 2} align="center"
          fontSize={Math.max(9, r * 0.65)}
          fontStyle="bold"
          fill="rgba(255,255,255,0.4)"
          listening={false}
        />
      )}

      {hasPlayer && viewOptions.showNames && lastName && (
        <Text
          text={lastName}
          x={-r * 2.2} y={r + 5}
          width={r * 4.4} align="center"
          fontSize={Math.max(9, r * 0.48)}
          fontStyle="600"
          fontFamily="Inter, system-ui, sans-serif"
          fill="rgba(255,255,255,0.92)"
          shadowColor="rgba(0,0,0,1)"
          shadowBlur={5}
          shadowOpacity={0.9}
          listening={false}
        />
      )}

      {hasPlayer && viewOptions.showPositions && slot.label && (
        <Text
          text={slot.label}
          x={-r * 1.6} y={-r - 15}
          width={r * 3.2} align="center"
          fontSize={Math.max(8, r * 0.44)}
          fontStyle="600"
          fill="rgba(255,255,255,0.65)"
          shadowColor="rgba(0,0,0,0.8)"
          shadowBlur={3}
          listening={false}
        />
      )}
    </Group>
  )
}

// ── Opponent Token ─────────────────────────────────────────────────────────────
function OpponentToken({ slot, fieldRect, isDraggable, onDragEnd, onRightClick }) {
  const { x: fx, y: fy, width: fw, height: fh } = fieldRect
  const sx = fx + slot.x * fw
  const sy = fy + slot.y * fh
  const r  = Math.max(14, Math.min(24, fh * 0.031))

  return (
    <Group
      x={sx} y={sy}
      draggable={isDraggable}
      onDragEnd={(e) => onDragEnd(slot.id, { x: e.target.x(), y: e.target.y() })}
      onContextMenu={(e) => { e.evt.preventDefault(); e.cancelBubble = true; onRightClick(slot, e) }}
    >
      <Rect
        x={-r - 2} y={-r - 2}
        width={(r + 2) * 2} height={(r + 2) * 2}
        rotation={45}
        fill="rgba(239,68,68,0.1)"
        listening={false}
      />
      <Rect
        x={-r} y={-r}
        width={r * 2} height={r * 2}
        rotation={45}
        fill="#1c0808"
        stroke="#ef4444"
        strokeWidth={2.5}
        shadowColor="rgba(239,68,68,0.4)"
        shadowBlur={8}
        shadowOffsetY={2}
      />
      <Text
        text={String(slot.number || '')}
        x={-r} y={-r * 0.54}
        width={r * 2} align="center"
        fontSize={Math.max(11, r * 0.8)}
        fontStyle="bold"
        fontFamily="Inter, system-ui, sans-serif"
        fill="#ef4444"
        listening={false}
      />
    </Group>
  )
}

// ── Exported Layer ─────────────────────────────────────────────────────────────
// All data is passed as props from FieldCanvas — no Zustand subscriptions here.
// Keeping Konva-reconciled components free of useSyncExternalStore prevents the
// Konva reconciler flush from interacting with Zustand's snapshot checks, which
// caused React error #185 on React 19.2.x.
export default function PlayerLayer({
  fieldRect, slots, opponents, teamPlayers, team, viewOptions,
  placingPlayerId, highlightedSlotId, activeTool,
  onSlotClick, onSlotRightClick, onTokenDragEnd,
  onOpponentDragEnd, onOpponentRightClick,
}) {
  const isDraggable = activeTool === 'select'

  return (
    <Layer>
      {slots.map((slot) => {
        const player = teamPlayers.find((p) => p.id === slot.playerId) || null
        return (
          <PlayerToken
            key={slot.id}
            slot={slot}
            player={player}
            team={team}
            fieldRect={fieldRect}
            isHighlighted={
              slot.id === highlightedSlotId ||
              (placingPlayerId && !slot.playerId)
            }
            isDraggable={isDraggable}
            viewOptions={viewOptions}
            onClick={onSlotClick}
            onRightClick={onSlotRightClick}
            onDragEnd={onTokenDragEnd}
          />
        )
      })}

      {opponents.map((opp) => (
        <OpponentToken
          key={opp.id}
          slot={opp}
          fieldRect={fieldRect}
          isDraggable={isDraggable}
          onDragEnd={onOpponentDragEnd}
          onRightClick={onOpponentRightClick}
        />
      ))}
    </Layer>
  )
}
