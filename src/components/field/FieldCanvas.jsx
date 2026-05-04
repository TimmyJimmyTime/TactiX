import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Stage, Layer, Rect, Circle } from 'react-konva'
import { v4 as uuid } from 'uuid'
import useStore from '../../store'
import { getFieldRect, screenToField, isInField, clampNorm } from '../../utils/fieldGeometry'
import FieldMarkings from './FieldMarkings'
import PlayerLayer    from './PlayerLayer'
import TelestrationLayer from './TelestrationLayer'

const DRAW_TOOLS = ['arrow', 'straight_arrow', 'freehand', 'zone']

// ── Path simplification ───────────────────────────────────────────────────────
function simplifyPath(pts, target = 7) {
  const n = Math.floor(pts.length / 2)
  if (n <= target) return pts
  const out = []
  for (let i = 0; i < target; i++) {
    const idx = Math.min(Math.round((i / (target - 1)) * (n - 1)), n - 1) * 2
    out.push(pts[idx], pts[idx + 1])
  }
  return out
}

const MIN_DIST_SQ = 0.00003

// ── Slot Popover ─────────────────────────────────────────────────────────────
function SlotPopover({ slot, screenX, screenY, players, onPlace, onClose }) {
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-[40]" onClick={onClose} />
      <div
        className="fixed z-[50] bg-panel border border-border rounded-xl shadow-2xl py-1 min-w-[170px] max-h-64 overflow-y-auto"
        style={{ left: Math.min(screenX, window.innerWidth - 190), top: Math.min(screenY, window.innerHeight - 280) }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-border mb-1">
          Place in {slot.label || 'slot'}
        </div>
        {players.length === 0 && (
          <div className="px-3 py-2 text-xs text-gray-500 italic">All players are on field</div>
        )}
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => onPlace(p.id)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-panel-light text-white transition-colors"
          >
            <span className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
              {p.number || '?'}
            </span>
            <span className="truncate">{p.name}</span>
            {p.positions?.length > 0 && (
              <span className="text-[10px] text-gray-500 shrink-0">{p.positions[0]}</span>
            )}
          </button>
        ))}
      </div>
    </>
  )
}

// ── FieldCanvas ───────────────────────────────────────────────────────────────
const FieldCanvas = forwardRef(function FieldCanvas({ boardId, phaseKey, presentMode = false }, ref) {
  const containerRef  = useRef(null)
  const stageRef      = useRef(null)
  const eraserActive  = useRef(false)

  const [size, setSize]             = useState({ width: 0, height: 0 })
  const [inProgress, setInProgress] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [textInput, setTextInput]   = useState(null)
  const [highlightedSlotId, setHighlightedSlotId] = useState(null)
  const [slotPopover, setSlotPopover] = useState(null)  // { slot, screenX, screenY }
  const [laserPos, setLaserPos]     = useState(null)    // { x, y } stage coords

  const boards              = useStore((s) => s.boards)
  const players             = useStore((s) => s.players)
  const activeTool          = useStore((s) => s.activeTool)
  const toolOptions         = useStore((s) => s.toolOptions)
  const placingPlayerId     = useStore((s) => s.placingPlayerId)
  const fieldTheme          = useStore((s) => s.fieldTheme)
  const viewOptions         = useStore((s) => s.viewOptions)
  // ↓ Direct subscription so component re-renders whenever THIS phase's data changes,
  //   keeping slots/opponents/teleItems fresh in every drag/click callback.
  const phaseData           = useStore((s) => s.boardPhases?.[boardId]?.[phaseKey])
  const setPhasePlayerSlots = useStore((s) => s.setPhasePlayerSlots)
  const setPhaseOpponentSlots = useStore((s) => s.setPhaseOpponentSlots)
  const setPlacingPlayerId  = useStore((s) => s.setPlacingPlayerId)
  const addTeleItem         = useStore((s) => s.addTelestrationItem)
  const removeTeleItem      = useStore((s) => s.removeTelestrationItem)
  const showToast           = useStore((s) => s.showToast)

  const board  = boards.find((b) => b.id === boardId)
  const format = board?.format || '11v11'

  // Derive current-phase arrays from the live subscription
  const teleItems  = phaseData?.telestration  || []
  const slots      = phaseData?.playerSlots   || []
  const opponents  = phaseData?.opponentSlots || []

  // Expose stage for export
  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
  }))

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([e]) => {
      setSize({ width: Math.floor(e.contentRect.width), height: Math.floor(e.contentRect.height) })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const fieldRect = size.width > 0
    ? getFieldRect(size.width, size.height, format)
    : { x: 0, y: 0, width: 0, height: 0 }

  // Team roster (for slot popover)
  const teamPlayers   = players[board?.teamId] || []
  const onFieldIds    = new Set(slots.map((s) => s.playerId).filter(Boolean))
  const availPlayers  = teamPlayers.filter((p) => p.isActive !== false && !onFieldIds.has(p.id))

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getFieldPos = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return null
    const pos = stage.getPointerPosition()
    if (!pos || !isInField(pos.x, pos.y, fieldRect)) return null
    return screenToField(pos.x, pos.y, fieldRect)
  }, [fieldRect])

  const eraseAtPos = useCallback((pos) => {
    const stage = stageRef.current
    if (!stage || !pos) return
    const shape = stage.getIntersection(pos)
    if (!shape) return
    const name = typeof shape.name === 'function' ? shape.name() : ''
    if (name.startsWith('tele-')) {
      removeTeleItem(boardId, phaseKey, name.slice(5))
    }
  }, [boardId, phaseKey, removeTeleItem])

  // ── Drag-from-sidebar drop ───────────────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const playerId = e.dataTransfer.getData('application/tactix-player')
    if (!playerId) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    if (!isInField(sx, sy, fieldRect)) return
    const fp = screenToField(sx, sy, fieldRect)
    const cx = clampNorm(fp.x)
    const cy = clampNorm(fp.y)

    // Already on field? Update position of their existing slot
    const existingSlot = slots.find((s) => s.playerId === playerId)
    if (existingSlot) {
      const newSlots = slots.map((s) => s.id === existingSlot.id ? { ...s, x: cx, y: cy } : s)
      setPhasePlayerSlots(boardId, phaseKey, newSlots)
    } else {
      // Find the nearest empty slot or create a new free slot
      const emptySlots = slots.filter((s) => !s.playerId)
      if (emptySlots.length > 0) {
        let best = emptySlots[0], bestDist = Infinity
        emptySlots.forEach((s) => {
          const d = Math.hypot(s.x - cx, s.y - cy)
          if (d < bestDist) { bestDist = d; best = s }
        })
        // If close enough to a slot, snap to it; else place freely
        if (bestDist < 0.12) {
          const newSlots = slots.map((s) => s.id === best.id ? { ...s, playerId } : s)
          setPhasePlayerSlots(boardId, phaseKey, newSlots)
        } else {
          const newSlots = [...slots, { id: uuid(), playerId, x: cx, y: cy, label: '' }]
          setPhasePlayerSlots(boardId, phaseKey, newSlots)
        }
      } else {
        const newSlots = [...slots, { id: uuid(), playerId, x: cx, y: cy, label: '' }]
        setPhasePlayerSlots(boardId, phaseKey, newSlots)
      }
    }
    showToast('Player placed ✓')
  }, [slots, fieldRect, boardId, phaseKey, setPhasePlayerSlots, showToast])

  // ── Mouse handlers ────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    setContextMenu(null)
    setSlotPopover(null)

    // Laser pointer in presentation mode
    if (presentMode && activeTool === 'laser') return

    if (activeTool === 'eraser') {
      eraserActive.current = true
      eraseAtPos(stageRef.current?.getPointerPosition())
      return
    }
    if (activeTool === 'select') return

    const fp = getFieldPos()
    if (!fp) return

    if (activeTool === 'text') {
      const stage = stageRef.current
      const pos   = stage.getPointerPosition()
      setTextInput({ screenX: pos.x, screenY: pos.y, nx: fp.x, ny: fp.y })
      return
    }

    if (DRAW_TOOLS.includes(activeTool)) {
      setInProgress({
        type: activeTool,
        points: [fp.x, fp.y],
        color: toolOptions.color,
        weight: toolOptions.weight,
        arrowStyle: toolOptions.arrowStyle,
        opacity: toolOptions.opacity,
      })
    }
  }, [activeTool, toolOptions, getFieldPos, eraseAtPos, presentMode])

  const handleMouseMove = useCallback((e) => {
    const stage = stageRef.current
    const pos   = stage?.getPointerPosition()

    // Laser pointer
    if (presentMode && activeTool === 'laser') {
      setLaserPos(pos || null)
      return
    }

    if (activeTool === 'eraser') {
      if (eraserActive.current) eraseAtPos(pos)
      return
    }

    if (!inProgress) return
    const fp = getFieldPos()
    if (!fp) return

    if (inProgress.type === 'freehand' || inProgress.type === 'arrow') {
      setInProgress((p) => {
        const pts = p.points
        const len = pts.length
        if (len >= 2) {
          const dx = fp.x - pts[len - 2]
          const dy = fp.y - pts[len - 1]
          if (dx * dx + dy * dy < MIN_DIST_SQ) return p
        }
        return { ...p, points: [...pts, fp.x, fp.y] }
      })
    } else {
      setInProgress((p) => ({ ...p, points: [p.points[0], p.points[1], fp.x, fp.y] }))
    }
  }, [activeTool, inProgress, getFieldPos, eraseAtPos, presentMode])

  const handleMouseUp = useCallback(() => {
    eraserActive.current = false
    if (!inProgress) return

    let finalPoints = inProgress.points
    if (inProgress.type === 'arrow' && finalPoints.length > 14) {
      finalPoints = simplifyPath(finalPoints, 7)
    }
    if (finalPoints.length >= 4) {
      addTeleItem(boardId, phaseKey, { ...inProgress, id: uuid(), points: finalPoints })
    }
    setInProgress(null)
  }, [inProgress, boardId, phaseKey, addTeleItem])

  // Clear laser when mouse leaves stage
  const handleMouseLeave = useCallback(() => {
    if (presentMode && activeTool === 'laser') setLaserPos(null)
  }, [presentMode, activeTool])

  // ── Stage click (placing player on open field) ────────────────────────────────
  const handleStageClick = useCallback((e) => {
    const name = e.target.name?.()
    if (name && name !== 'field-bg') return

    if (placingPlayerId) {
      const fp = getFieldPos()
      if (!fp) return
      const empties = slots.filter((s) => !s.playerId)
      if (empties.length > 0) {
        let best = empties[0], bestDist = Infinity
        empties.forEach((s) => {
          const d = Math.hypot(s.x - fp.x, s.y - fp.y)
          if (d < bestDist) { bestDist = d; best = s }
        })
        const newSlots = slots.map((s) => s.id === best.id ? { ...s, playerId: placingPlayerId } : s)
        setPhasePlayerSlots(boardId, phaseKey, newSlots)
      } else {
        const newSlots = [...slots, { id: uuid(), playerId: placingPlayerId, x: fp.x, y: fp.y, label: '' }]
        setPhasePlayerSlots(boardId, phaseKey, newSlots)
      }
      setPlacingPlayerId(null)
      showToast('Player placed ✓')
    }
  }, [placingPlayerId, slots, boardId, phaseKey, getFieldPos, setPhasePlayerSlots, setPlacingPlayerId, showToast])

  // ── Slot interactions ─────────────────────────────────────────────────────────
  const handleSlotClick = useCallback((slot) => {
    if (placingPlayerId) {
      const newSlots = slots.map((s) => s.id === slot.id ? { ...s, playerId: placingPlayerId } : s)
      setPhasePlayerSlots(boardId, phaseKey, newSlots)
      setPlacingPlayerId(null)
      showToast('Player placed ✓')
      return
    }
    if (activeTool === 'select') {
      if (!slot.playerId) {
        // Show popover to pick from available players
        const stage = stageRef.current
        if (!stage) return
        const container = stage.container().getBoundingClientRect()
        const sx = container.left + fieldRect.x + slot.x * fieldRect.width
        const sy = container.top  + fieldRect.y + slot.y * fieldRect.height
        setSlotPopover({ slot, screenX: sx + 20, screenY: sy - 10 })
      } else {
        setHighlightedSlotId((prev) => prev === slot.id ? null : slot.id)
      }
    }
  }, [placingPlayerId, slots, boardId, phaseKey, activeTool, fieldRect, setPhasePlayerSlots, setPlacingPlayerId, showToast])

  const handleSlotRightClick = useCallback((slot, e) => {
    const stage = stageRef.current
    if (!stage) return
    const container = stage.container().getBoundingClientRect()
    const pos = stage.getPointerPosition()
    setContextMenu({ x: container.left + pos.x, y: container.top + pos.y, slot, type: 'player' })
  }, [])

  const handleOpponentRightClick = useCallback((opp, e) => {
    const stage = stageRef.current
    if (!stage) return
    const container = stage.container().getBoundingClientRect()
    const pos = stage.getPointerPosition()
    setContextMenu({ x: container.left + pos.x, y: container.top + pos.y, slot: opp, type: 'opponent' })
  }, [])

  const handleTokenDragEnd = useCallback((slotId, screenPos) => {
    const fp = screenToField(screenPos.x, screenPos.y, fieldRect)
    const cx = clampNorm(fp.x)
    const cy = clampNorm(fp.y)
    const newSlots = slots.map((s) => s.id === slotId ? { ...s, x: cx, y: cy } : s)
    setPhasePlayerSlots(boardId, phaseKey, newSlots)
  }, [slots, fieldRect, boardId, phaseKey, setPhasePlayerSlots])

  const handleOpponentDragEnd = useCallback((oppId, screenPos) => {
    const fp = screenToField(screenPos.x, screenPos.y, fieldRect)
    const cx = clampNorm(fp.x)
    const cy = clampNorm(fp.y)
    const newOpps = opponents.map((o) => o.id === oppId ? { ...o, x: cx, y: cy } : o)
    setPhaseOpponentSlots(boardId, phaseKey, newOpps)
  }, [opponents, fieldRect, boardId, phaseKey, setPhaseOpponentSlots])

  // ── Context menu actions ──────────────────────────────────────────────────────
  const removeTokenFromField = (slot) => {
    const newSlots = slots.filter((s) => s.id !== slot.id)
    setPhasePlayerSlots(boardId, phaseKey, newSlots)
    setContextMenu(null)
    showToast('Removed ✓')
  }
  const unassignPlayer = (slot) => {
    const newSlots = slots.map((s) => s.id === slot.id ? { ...s, playerId: null } : s)
    setPhasePlayerSlots(boardId, phaseKey, newSlots)
    setContextMenu(null)
    showToast('Player removed from slot')
  }
  const toggleHighlight = (slot) => {
    setHighlightedSlotId((prev) => prev === slot.id ? null : slot.id)
    setContextMenu(null)
  }
  const removeOpponent = (opp) => {
    const newOpps = opponents.filter((o) => o.id !== opp.id)
    setPhaseOpponentSlots(boardId, phaseKey, newOpps)
    setContextMenu(null)
  }

  // ── Text submit ────────────────────────────────────────────────────────────────
  const submitText = (text) => {
    if (text.trim()) {
      addTeleItem(boardId, phaseKey, {
        id: uuid(), type: 'text',
        points: [textInput.nx, textInput.ny],
        text: text.trim(),
        color: toolOptions.color,
        fontSize: toolOptions.fontSize || 'medium',
      })
    }
    setTextInput(null)
  }

  // ── Slot popover place ─────────────────────────────────────────────────────────
  const handlePopoverPlace = useCallback((playerId) => {
    if (!slotPopover) return
    const newSlots = slots.map((s) => s.id === slotPopover.slot.id ? { ...s, playerId } : s)
    setPhasePlayerSlots(boardId, phaseKey, newSlots)
    setSlotPopover(null)
    showToast('Player placed ✓')
  }, [slotPopover, slots, boardId, phaseKey, setPhasePlayerSlots, showToast])

  const cursorClass = activeTool === 'select'  ? 'cursor-default'
    : activeTool === 'eraser'  ? 'cursor-cell'
    : activeTool === 'laser'   ? 'cursor-none'
    : 'cursor-crosshair'

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onClick={() => { setContextMenu(null); setSlotPopover(null) }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {size.width > 0 && (
        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          className={cursorClass}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleStageClick}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          <FieldMarkings fieldRect={fieldRect} format={format} theme={fieldTheme} showGrid={viewOptions.showGrid} />

          {/* Invisible hit bg for stage clicks */}
          <Layer>
            <Rect
              name="field-bg"
              x={fieldRect.x} y={fieldRect.y}
              width={fieldRect.width} height={fieldRect.height}
              fill="transparent"
              listening={activeTool === 'select' || !!placingPlayerId}
            />
          </Layer>

          <PlayerLayer
            fieldRect={fieldRect}
            boardId={boardId}
            phaseKey={phaseKey}
            placingPlayerId={placingPlayerId}
            highlightedSlotId={highlightedSlotId}
            activeTool={activeTool}
            onSlotClick={handleSlotClick}
            onSlotRightClick={handleSlotRightClick}
            onTokenDragEnd={handleTokenDragEnd}
            onOpponentDragEnd={handleOpponentDragEnd}
            onOpponentRightClick={handleOpponentRightClick}
          />

          <TelestrationLayer
            fieldRect={fieldRect}
            items={teleItems}
            inProgress={inProgress}
          />

          {/* Laser pointer layer */}
          {presentMode && activeTool === 'laser' && laserPos && (
            <Layer listening={false}>
              <Circle
                x={laserPos.x} y={laserPos.y}
                radius={10}
                fill="rgba(255,30,30,0.85)"
                shadowColor="rgba(255,0,0,0.9)"
                shadowBlur={20}
              />
              <Circle
                x={laserPos.x} y={laserPos.y}
                radius={4}
                fill="#ffffff"
              />
            </Layer>
          )}
        </Stage>
      )}

      {/* ── Placing-player banner ── */}
      {placingPlayerId && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-lime text-black text-xs font-bold px-3 py-1 rounded-full pointer-events-none shadow-lg z-20">
          Click field or slot to place player · Esc to cancel
        </div>
      )}

      {/* ── Text input overlay ── */}
      {textInput && (
        <div
          className="absolute z-30"
          style={{ left: textInput.screenX, top: textInput.screenY }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            autoFocus
            className="bg-black/80 border border-lime text-white text-sm px-2 py-1 rounded outline-none w-36"
            placeholder="Type annotation…"
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitText(e.target.value)
              if (e.key === 'Escape') setTextInput(null)
            }}
            onBlur={(e) => submitText(e.target.value)}
          />
        </div>
      )}

      {/* ── Slot popover ── */}
      {slotPopover && (
        <SlotPopover
          slot={slotPopover.slot}
          screenX={slotPopover.screenX}
          screenY={slotPopover.screenY}
          players={availPlayers}
          onPlace={handlePopoverPlace}
          onClose={() => setSlotPopover(null)}
        />
      )}

      {/* ── Context menu ── */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-panel border border-border rounded-xl shadow-2xl py-1 min-w-[170px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'player' ? (
            <>
              <button onClick={() => toggleHighlight(contextMenu.slot)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-panel-light text-white">
                {highlightedSlotId === contextMenu.slot.id ? '★ Highlighted' : '☆ Highlight'}
              </button>
              {contextMenu.slot.playerId && (
                <button onClick={() => unassignPlayer(contextMenu.slot)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-panel-light text-white">
                  ↩ Remove player
                </button>
              )}
              <button onClick={() => removeTokenFromField(contextMenu.slot)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-panel-light text-red-400">
                🗑 Delete slot
              </button>
            </>
          ) : (
            <>
              <button onClick={() => removeOpponent(contextMenu.slot)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-panel-light text-red-400">
                🗑 Remove opponent
              </button>
            </>
          )}
          <button onClick={() => setContextMenu(null)}
            className="w-full text-left px-4 py-2 text-sm hover:bg-panel-light text-gray-500">
            Cancel
          </button>
        </div>
      )}
    </div>
  )
})

export default FieldCanvas
