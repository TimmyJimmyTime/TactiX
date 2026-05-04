import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Stage, Layer, Circle, Text, Rect } from 'react-konva'
import { v4 as uuid } from 'uuid'
import useStore from '../../store'
import FieldMarkings from '../field/FieldMarkings'
import { getFieldRect, screenToField, isInField, clampNorm } from '../../utils/fieldGeometry'

const COMMON_LABELS = ['GK','CB','RB','LB','RWB','LWB','CDM','CM','DM','RM','LM','CAM','RW','LW','ST','CF','SS','SW']

function getFieldRectForSize(w, h, format) {
  return getFieldRect(w, h, format, 16)
}

export default function FormationBuilderModal({ format, onClose, editingName = null }) {
  const [name, setName] = useState(editingName || '')
  const [markers, setMarkers] = useState([])
  const [pendingPos, setPendingPos] = useState(null)  // { x, y, screenX, screenY }
  const [pendingLabel, setPendingLabel] = useState('GK')
  const [selected, setSelected] = useState(null)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const labelInputRef = useRef(null)

  const customFormations = useStore((s) => s.customFormations)
  const saveCustomFormation = useStore((s) => s.saveCustomFormation)
  const deleteCustomFormation = useStore((s) => s.deleteCustomFormation)

  // Editing an existing formation — load its markers
  useEffect(() => {
    if (editingName) {
      const positions = customFormations[format]?.[editingName] || []
      setMarkers(positions.map((p) => ({ ...p, id: uuid() })))
    }
  }, [editingName, format, customFormations])

  // Size the Konva stage to fit the container
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([e]) => {
      setStageSize({ width: Math.floor(e.contentRect.width), height: Math.floor(e.contentRect.height) })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const fieldRect = stageSize.width > 0
    ? getFieldRectForSize(stageSize.width, stageSize.height, format)
    : { x: 0, y: 0, width: 0, height: 0 }

  const handleStageClick = useCallback((e) => {
    if (e.target !== e.target.getStage() && e.target.name() !== 'field-bg') return
    const stage = stageRef.current
    if (!stage) return
    const pos = stage.getPointerPosition()
    if (!pos || !isInField(pos.x, pos.y, fieldRect)) return
    const fp = screenToField(pos.x, pos.y, fieldRect)
    // Get screen position for the label popup
    const container = stage.container().getBoundingClientRect()
    setPendingPos({ x: fp.x, y: fp.y, screenX: container.left + pos.x, screenY: container.top + pos.y })
    // Auto-suggest next label
    const usedGK = markers.some((m) => m.label === 'GK')
    setPendingLabel(usedGK ? 'CB' : 'GK')
    setTimeout(() => labelInputRef.current?.focus(), 50)
  }, [fieldRect, markers])

  const confirmMarker = () => {
    if (!pendingPos || !pendingLabel.trim()) { setPendingPos(null); return }
    setMarkers((ms) => [...ms, { id: uuid(), label: pendingLabel.trim().toUpperCase(), x: pendingPos.x, y: pendingPos.y }])
    setPendingPos(null)
    setPendingLabel('')
  }

  const removeMarker = (id) => {
    setMarkers((ms) => ms.filter((m) => m.id !== id))
    if (selected === id) setSelected(null)
  }

  const updateLabel = (id, label) => {
    setMarkers((ms) => ms.map((m) => m.id === id ? { ...m, label } : m))
  }

  const handleSave = () => {
    if (!name.trim()) return
    if (markers.length < 1) return
    const positions = markers.map(({ label, x, y }) => ({ label, x, y }))
    // Delete old if renaming
    if (editingName && editingName !== name.trim()) {
      deleteCustomFormation(format, editingName)
    }
    saveCustomFormation(format, name.trim(), positions)
    onClose(name.trim())
  }

  const handleMarkerDragEnd = (id, e) => {
    const stage = stageRef.current
    if (!stage) return
    const sx = e.target.x()
    const sy = e.target.y()
    const fp = screenToField(sx, sy, fieldRect)
    setMarkers((ms) => ms.map((m) => m.id === id ? { ...m, x: clampNorm(fp.x), y: clampNorm(fp.y) } : m))
  }

  const toSx = (nx) => fieldRect.x + nx * fieldRect.width
  const toSy = (ny) => fieldRect.y + ny * fieldRect.height

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[150]"
      onClick={onClose}>
      <div className="bg-panel border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 700, maxWidth: '98vw', maxHeight: '95vh' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="text-lg font-bold text-white">
            {editingName ? 'Edit Formation' : 'Formation Builder'}
          </div>
          <div className="flex-1" />
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Field area */}
          <div ref={containerRef} className="flex-1 min-w-0 relative" style={{ minHeight: 400 }}>
            {stageSize.width > 0 && (
              <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                onClick={handleStageClick}
                className="cursor-crosshair"
              >
                <FieldMarkings fieldRect={fieldRect} format={format} theme="dark" />

                <Layer>
                  {/* Invisible bg for click */}
                  <Rect
                    name="field-bg"
                    x={fieldRect.x} y={fieldRect.y}
                    width={fieldRect.width} height={fieldRect.height}
                    fill="transparent"
                  />

                  {/* Markers */}
                  {markers.map((m) => {
                    const sx = toSx(m.x)
                    const sy = toSy(m.y)
                    const r = 18
                    const isSelected = selected === m.id
                    return (
                      <React.Fragment key={m.id}>
                        {isSelected && <Circle x={sx} y={sy} radius={r + 6} fill="rgba(174,234,0,0.15)" listening={false} />}
                        <Circle
                          x={sx} y={sy} radius={r}
                          fill={isSelected ? '#2a2f3a' : '#1e2330'}
                          stroke={isSelected ? '#AEEA00' : 'rgba(255,255,255,0.8)'}
                          strokeWidth={isSelected ? 2.5 : 2}
                          draggable
                          onClick={(e) => { e.cancelBubble = true; setSelected(m.id === selected ? null : m.id) }}
                          onDragEnd={(e) => handleMarkerDragEnd(m.id, e)}
                          shadowColor="rgba(0,0,0,0.6)" shadowBlur={8} shadowOffsetY={2}
                        />
                        <Text
                          x={sx - r} y={sy - 6}
                          width={r * 2} align="center"
                          text={m.label}
                          fontSize={m.label.length > 2 ? 9 : 11}
                          fontStyle="700"
                          fontFamily="Inter, system-ui, sans-serif"
                          fill={isSelected ? '#AEEA00' : '#ffffff'}
                          listening={false}
                        />
                      </React.Fragment>
                    )
                  })}

                  {/* Pending marker preview */}
                  {pendingPos && (
                    <Circle
                      x={toSx(pendingPos.x)} y={toSy(pendingPos.y)}
                      radius={18} fill="#AEEA00" opacity={0.5}
                      stroke="#AEEA00" strokeWidth={2}
                      listening={false}
                    />
                  )}
                </Layer>
              </Stage>
            )}

            {/* Pending label input overlay */}
            {pendingPos && (
              <div
                className="absolute z-30 bg-panel border border-lime rounded-xl p-3 shadow-xl"
                style={{
                  left: Math.min(pendingPos.screenX - containerRef.current?.getBoundingClientRect().left, stageSize.width - 200),
                  top: Math.max(0, pendingPos.screenY - containerRef.current?.getBoundingClientRect().top - 80),
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-xs text-gray-400 mb-2">Position label</div>
                <div className="flex flex-wrap gap-1 mb-2 max-w-[180px]">
                  {COMMON_LABELS.map((l) => (
                    <button key={l} onClick={() => setPendingLabel(l)}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition-colors
                        ${pendingLabel === l ? 'bg-lime text-black font-bold' : 'bg-panel-light text-gray-300 hover:bg-border'}`}>
                      {l}
                    </button>
                  ))}
                </div>
                <input
                  ref={labelInputRef}
                  value={pendingLabel}
                  onChange={(e) => setPendingLabel(e.target.value.toUpperCase().slice(0, 5))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmMarker()
                    if (e.key === 'Escape') setPendingPos(null)
                  }}
                  className="w-full bg-panel-light border border-border rounded px-2 py-1 text-sm text-white outline-none mb-2"
                  placeholder="e.g. CB"
                  maxLength={5}
                />
                <div className="flex gap-1">
                  <button onClick={confirmMarker}
                    className="flex-1 bg-lime text-black text-xs font-bold py-1.5 rounded-lg hover:bg-lime-dark">
                    Add ↵
                  </button>
                  <button onClick={() => setPendingPos(null)}
                    className="bg-panel-light text-gray-400 text-xs px-2 py-1.5 rounded-lg hover:bg-border">
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Hint */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-gray-500 pointer-events-none">
              Click field to add positions · drag to reposition
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-56 border-l border-border flex flex-col shrink-0">
            {/* Formation name */}
            <div className="px-4 py-3 border-b border-border">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Formation Name</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My High Press"
                className="w-full bg-panel-light border border-border rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-lime"
              />
            </div>

            {/* Marker list */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">
                Positions ({markers.length})
              </div>
              {markers.length === 0 && (
                <div className="text-xs text-gray-600 italic">Click the field to add positions</div>
              )}
              {markers.map((m) => (
                <div key={m.id}
                  className={`flex items-center gap-2 mb-1 px-2 py-1 rounded-lg cursor-pointer transition-colors
                    ${selected === m.id ? 'bg-lime/10 border border-lime/30' : 'hover:bg-panel-light'}`}
                  onClick={() => setSelected(m.id === selected ? null : m.id)}
                >
                  <div className="w-5 h-5 rounded-full bg-panel-light border border-border flex items-center justify-center shrink-0">
                    <span className="text-[9px] text-gray-300 font-bold">{m.label.slice(0,2)}</span>
                  </div>
                  <input
                    value={m.label}
                    onChange={(e) => updateLabel(m.id, e.target.value.toUpperCase().slice(0, 5))}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent text-xs text-white outline-none border-b border-transparent focus:border-gray-600"
                    maxLength={5}
                  />
                  <button onClick={(e) => { e.stopPropagation(); removeMarker(m.id) }}
                    className="text-gray-600 hover:text-red-400 text-sm leading-none">
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="px-3 py-3 border-t border-border flex flex-col gap-2">
              <button
                onClick={handleSave}
                disabled={!name.trim() || markers.length < 1}
                className="w-full bg-lime text-black text-sm font-bold py-2.5 rounded-xl hover:bg-lime-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Formation
              </button>
              <button onClick={onClose}
                className="w-full bg-panel-light text-gray-400 text-sm py-2 rounded-xl hover:bg-border transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

