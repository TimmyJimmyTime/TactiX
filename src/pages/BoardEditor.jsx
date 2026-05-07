import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import useStore from '../store'
import FieldCanvas from '../components/field/FieldCanvas'
import LeftPanel   from '../components/panels/LeftPanel'
import RightPanel  from '../components/panels/RightPanel'
import ConfirmModal from '../components/modals/ConfirmModal'
import { exportPNG, exportPDF, exportFullPDF } from '../utils/exportUtils'

const PHASES = [
  { key: 'attack',    label: 'Attack',      icon: '⚔️',  color: '#22c55e' },
  { key: 'defense',   label: 'Defense',     icon: '🛡️',  color: '#3b82f6' },
  { key: 'off_trans', label: 'Off. Trans.', icon: '⚡',  color: '#f59e0b' },
  { key: 'def_trans', label: 'Def. Trans.', icon: '↩️',  color: '#ef4444' },
]

const PHASE_KEYS = PHASES.map((p) => p.key)

// ── Export dropdown ────────────────────────────────────────────────────────────
function ExportMenu({ canvasRef, boardName, phaseName, onClose, onExportPlaybook }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const doExport = (type) => {
    const stage = canvasRef.current?.getStage()
    if (!stage) { onClose(); return }
    if (type === 'png') exportPNG(stage, boardName, phaseName)
    if (type === 'pdf') exportPDF(stage, boardName, phaseName)
    if (type === 'print') window.print()
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-[40]" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1 z-[50] bg-panel border border-border rounded-xl shadow-2xl py-1 w-52">
        <button onClick={() => doExport('png')}
          className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-panel-light transition-colors flex items-center gap-2">
          <span>🖼</span> Save as PNG
        </button>
        <button onClick={() => doExport('pdf')}
          className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-panel-light transition-colors flex items-center gap-2">
          <span>📄</span> Save as PDF
        </button>
        <div className="border-t border-border my-1" />
        <button
          onClick={() => { onClose(); onExportPlaybook() }}
          className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-panel-light transition-colors flex items-center gap-2"
        >
          <span>📋</span>
          <span>Export Playbook PDF</span>
          <span className="ml-auto text-[10px] text-gray-500">All phases</span>
        </button>
        <div className="border-t border-border my-1" />
        <button onClick={() => doExport('print')}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-panel-light hover:text-white transition-colors flex items-center gap-2">
          <span>🖨</span> Print
        </button>
      </div>
    </>
  )
}

// ── Duplicate Phase Modal ─────────────────────────────────────────────────────
function DuplicatePhaseModal({ currentPhase, boardId, onClose }) {
  const duplicatePhase = useStore((s) => s.duplicatePhase)
  const showToast      = useStore((s) => s.showToast)
  const [target, setTarget] = useState(PHASES.find((p) => p.key !== currentPhase)?.key || 'defense')

  const handle = () => {
    duplicatePhase(boardId, currentPhase, target)
    showToast(`Copied to ${PHASES.find((p) => p.key === target)?.label} ✓`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200]"
      onClick={onClose}>
      <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-xs shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-white mb-1">Copy Phase To</h3>
        <p className="text-sm text-gray-400 mb-4">
          Copy all players and annotations from{' '}
          <strong className="text-white">{PHASES.find((p) => p.key === currentPhase)?.label}</strong> to:
        </p>
        <div className="flex flex-col gap-2 mb-5">
          {PHASES.filter((p) => p.key !== currentPhase).map((p) => (
            <button
              key={p.key}
              onClick={() => setTarget(p.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all border
                ${target === p.key
                  ? 'border-lime text-lime bg-lime/10 font-bold'
                  : 'border-border text-gray-300 hover:border-gray-500'}`}
            >
              <span>{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handle}
            className="flex-1 bg-lime text-black font-bold py-2.5 rounded-xl text-sm hover:bg-lime-dark transition-colors">
            Copy Phase
          </button>
          <button onClick={onClose}
            className="flex-1 bg-panel-light text-gray-400 py-2.5 rounded-xl text-sm hover:bg-border transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main BoardEditor ───────────────────────────────────────────────────────────
export default function BoardEditor() {
  const { boardId } = useParams()
  const navigate    = useNavigate()

  const boards            = useStore((s) => s.boards)
  const teams             = useStore((s) => s.teams)
  const currentPhase      = useStore((s) => s.currentPhase)
  const setCurrentPhase   = useStore((s) => s.setCurrentPhase)
  const setCurrentBoardId = useStore((s) => s.setCurrentBoardId)
  const undoTele          = useStore((s) => s.undoTelestration)
  const redoTele          = useStore((s) => s.redoTelestration)
  const clearTele         = useStore((s) => s.clearTelestration)
  const getPhaseState     = useStore((s) => s.getPhaseState)
  const setPhasePlayerSlots = useStore((s) => s.setPhasePlayerSlots)
  const updateBoard       = useStore((s) => s.updateBoard)
  const setActiveTool     = useStore((s) => s.setActiveTool)
  const placingPlayerId   = useStore((s) => s.placingPlayerId)
  const setPlacingPlayerId = useStore((s) => s.setPlacingPlayerId)
  const showToast         = useStore((s) => s.showToast)
  const activeTool        = useStore((s) => s.activeTool)
  const phaseNotes        = useStore((s) => s.phaseNotes)

  const fieldCanvasRef = useRef(null)

  const [presentMode,      setPresentMode]      = useState(false)
  const [editingName,      setEditingName]      = useState(false)
  const [boardName,        setBoardName]        = useState('')
  const [showExport,       setShowExport]       = useState(false)
  const [confirmClear,     setConfirmClear]     = useState(false)
  const [confirmPhase,     setConfirmPhase]     = useState(null)
  const [showDupPhase,     setShowDupPhase]     = useState(false)
  const [leftOpen,         setLeftOpen]         = useState(false)
  const [rightOpen,        setRightOpen]        = useState(false)
  const [laserActive,      setLaserActive]      = useState(false)
  const [phaseOpacity,     setPhaseOpacity]     = useState(1)
  const [exportingPlaybook,setExportingPlaybook]= useState(false)
  const [exportProgress,   setExportProgress]   = useState('')  // status message
  const [autoPlay,         setAutoPlay]         = useState(false)
  const [autoPlaySpeed,    setAutoPlaySpeed]     = useState(4000) // ms per phase
  const autoPlayRef = useRef(false) // mutable ref for interval callback

  const board  = boards.find((b) => b.id === boardId)
  const team   = teams.find((t) => t.id === board?.teamId)

  useEffect(() => { setCurrentBoardId(boardId) }, [boardId, setCurrentBoardId])
  useEffect(() => { if (board) setBoardName(board.name) }, [board])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undoTele(boardId, currentPhase) }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redoTele(boardId, currentPhase) }
      if (e.key === 'Escape') {
        setPresentMode(false)
        setPlacingPlayerId(null)
        setActiveTool('select')
        setLaserActive(false)
        setLeftOpen(false)
        setRightOpen(false)
      }
      // Tool shortcuts (only when not typing)
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 's') setActiveTool('select')
      if (e.key === 'a') setActiveTool('arrow')
      if (e.key === 'f') setActiveTool('freehand')
      if (e.key === 'e') setActiveTool('eraser')
      if (e.key === 'p') setActiveTool('straight_arrow')
      if (e.key === 't') setActiveTool('text')
      if (e.key === 'z' && !e.ctrlKey && !e.metaKey) setActiveTool('zone')
      // Laser shortcut in present mode
      if (presentMode && e.key === 'k') {
        const next = !laserActive
        setLaserActive(next)
        setActiveTool(next ? 'laser' : 'select')
      }
      // Presentation mode: arrow keys cycle phases
      if (presentMode) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          const idx = PHASE_KEYS.indexOf(currentPhase)
          animatePhaseChange(PHASE_KEYS[(idx + 1) % PHASE_KEYS.length])
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          const idx = PHASE_KEYS.indexOf(currentPhase)
          animatePhaseChange(PHASE_KEYS[(idx - 1 + PHASE_KEYS.length) % PHASE_KEYS.length])
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [boardId, currentPhase, undoTele, redoTele, setActiveTool, setPlacingPlayerId, presentMode, laserActive])

  // Animated phase transition
  const animatePhaseChange = useCallback((newPhase) => {
    if (newPhase === currentPhase) return
    setPhaseOpacity(0)
    setTimeout(() => {
      setCurrentPhase(newPhase)
      setPhaseOpacity(1)
    }, 130)
  }, [currentPhase, setCurrentPhase])

  const handlePhaseChange = (phase) => {
    if (phase === currentPhase) return
    const newPhaseState = getPhaseState(boardId, phase)
    const curState      = getPhaseState(boardId, currentPhase)
    if (
      (!newPhaseState.playerSlots || newPhaseState.playerSlots.length === 0) &&
      curState.playerSlots?.length > 0
    ) {
      setConfirmPhase(phase)
      return
    }
    animatePhaseChange(phase)
  }

  const handleConfirmPhaseCopy = () => {
    const curState = getPhaseState(boardId, currentPhase)
    setPhasePlayerSlots(boardId, confirmPhase, curState.playerSlots.map((s) => ({ ...s })))
    animatePhaseChange(confirmPhase)
    setConfirmPhase(null)
  }

  // ── Auto play-through (presentation mode) ────────────────────────────────────
  useEffect(() => {
    autoPlayRef.current = autoPlay
  }, [autoPlay])

  useEffect(() => {
    if (!autoPlay || !presentMode) return
    const interval = setInterval(() => {
      if (!autoPlayRef.current) return
      setCurrentPhase((prev) => {
        const idx = PHASE_KEYS.indexOf(prev)
        const next = PHASE_KEYS[(idx + 1) % PHASE_KEYS.length]
        setPhaseOpacity(0)
        setTimeout(() => setPhaseOpacity(1), 130)
        return next
      })
    }, autoPlaySpeed)
    return () => clearInterval(interval)
  }, [autoPlay, presentMode, autoPlaySpeed, setCurrentPhase])

  // Clean up when exiting presentation mode (any exit path)
  useEffect(() => {
    if (!presentMode) {
      setAutoPlay(false)
      setLaserActive(false)
      setActiveTool('select')
    }
  }, [presentMode, setActiveTool])

  // ── Export full playbook (all 4 phases) ───────────────────────────────────────
  const exportPlaybook = useCallback(async () => {
    const stage = fieldCanvasRef.current?.getStage()
    if (!stage || !board) return

    setExportingPlaybook(true)
    const savedPhase = currentPhase
    const results = []

    for (const phase of PHASES) {
      setExportProgress(`Capturing ${phase.label}…`)
      setCurrentPhase(phase.key)
      // Wait for React + Konva to render the new phase
      await new Promise((r) => setTimeout(r, 350))
      const dataURL = stage.toDataURL({ pixelRatio: 2, mimeType: 'image/jpeg', quality: 0.92 })
      results.push({
        phaseName: phase.label,
        dataURL,
        width: stage.width(),
        height: stage.height(),
      })
    }

    // Restore original phase
    setCurrentPhase(savedPhase)
    setExportProgress('Building PDF…')
    await new Promise((r) => setTimeout(r, 50))

    exportFullPDF(results, board.name)
    showToast('Playbook exported ✓')
    setExportingPlaybook(false)
    setExportProgress('')
  }, [currentPhase, board, setCurrentPhase, showToast])

  const handleFlipSides = () => {
    const state   = getPhaseState(boardId, currentPhase)
    const flipped = (state.playerSlots || []).map((s) => ({ ...s, y: 1 - s.y }))
    setPhasePlayerSlots(boardId, currentPhase, flipped)
    showToast('Sides flipped ✓')
  }

  const saveName = () => {
    if (boardName.trim()) updateBoard(boardId, { name: boardName.trim() })
    setEditingName(false)
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 flex-col gap-3">
        <span>Board not found.</span>
        <button onClick={() => navigate('/')} className="text-lime hover:underline text-sm">← Back to Dashboard</button>
      </div>
    )
  }

  const phaseInfo = PHASES.find((p) => p.key === currentPhase) || PHASES[0]

  // ── Presentation Mode ─────────────────────────────────────────────────────────
  if (presentMode) {
    const presentActiveTool = laserActive ? 'laser' : activeTool
    const presentNote = phaseNotes?.[boardId]?.[currentPhase] || ''

    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        {/* Phase transition wrapper */}
        <div
          className="flex-1 min-h-0 transition-opacity duration-150"
          style={{ opacity: phaseOpacity }}
        >
          <FieldCanvas
            ref={fieldCanvasRef}
            boardId={boardId}
            phaseKey={currentPhase}
            presentMode
          />
        </div>

        {/* Notes overlay — shows if current phase has notes */}
        {presentNote && (
          <div className="absolute bottom-20 left-6 right-6 sm:left-auto sm:right-6 sm:max-w-xs pointer-events-none">
            <div
              className="bg-black/75 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap"
              style={{ transition: 'opacity 0.3s', opacity: phaseOpacity }}
            >
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-bold">
                {phaseInfo.icon} {phaseInfo.label} — Coach Notes
              </div>
              {presentNote}
            </div>
          </div>
        )}

        {/* Floating bottom toolbar */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/85 border border-border rounded-2xl px-3 py-2 backdrop-blur-sm z-10 shadow-2xl flex-wrap justify-center max-w-[95vw]">
          {/* Phase buttons */}
          {PHASES.map((p) => (
            <button key={p.key}
              onClick={() => { setAutoPlay(false); animatePhaseChange(p.key) }}
              title={p.label}
              className={`text-base px-2.5 py-1.5 rounded-xl transition-all font-medium
                ${currentPhase === p.key ? 'text-black shadow-md' : 'text-gray-400 hover:text-white'}`}
              style={currentPhase === p.key ? { backgroundColor: p.color } : {}}>
              {p.icon}
            </button>
          ))}

          <div className="w-px h-5 bg-border mx-0.5" />

          {/* Auto-play controls */}
          <button
            onClick={() => setAutoPlay((v) => !v)}
            title={autoPlay ? 'Pause auto-advance' : 'Auto-advance phases'}
            className={`text-xs px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1
              ${autoPlay ? 'bg-lime text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-panel-light'}`}
          >
            {autoPlay ? '⏸' : '▶'} Auto
          </button>

          {autoPlay && (
            <select
              value={autoPlaySpeed}
              onChange={(e) => setAutoPlaySpeed(Number(e.target.value))}
              className="bg-panel-light border border-border text-xs text-gray-300 rounded-lg px-1.5 py-1 outline-none"
              title="Advance speed"
            >
              <option value={2000}>2s</option>
              <option value={4000}>4s</option>
              <option value={6000}>6s</option>
              <option value={10000}>10s</option>
            </select>
          )}

          <div className="w-px h-5 bg-border mx-0.5" />

          {/* Laser tool */}
          <button
            onClick={() => {
              const next = !laserActive
              setLaserActive(next)
              setActiveTool(next ? 'laser' : 'select')
            }}
            title="Laser pointer (K)"
            className={`text-sm px-2.5 py-1.5 rounded-xl transition-all
              ${laserActive ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-gray-400 hover:text-white hover:bg-panel-light'}`}
          >
            ⊙
          </button>

          <div className="w-px h-5 bg-border mx-0.5" />

          <button onClick={() => undoTele(boardId, currentPhase)}
            title="Undo (Ctrl+Z)"
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-panel-light">
            ↩
          </button>

          <div className="w-px h-5 bg-border mx-0.5" />

          <button onClick={() => { setPresentMode(false); setLaserActive(false); setActiveTool('select') }}
            title="Exit presentation (Esc)"
            className="text-xs text-gray-400 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-panel-light">
            ✕ Exit
          </button>
        </div>

        {/* Phase badge top-right */}
        <div className="absolute top-4 right-4 text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
          style={{ backgroundColor: phaseInfo.color + '33', color: phaseInfo.color, border: `1px solid ${phaseInfo.color}55` }}>
          {autoPlay && <span className="text-xs opacity-70 animate-pulse">▶</span>}
          {phaseInfo.icon} {phaseInfo.label}
        </div>

        {/* Keyboard hint */}
        <div className="absolute top-4 left-4 text-[10px] text-gray-600">
          ← → cycle phases · Esc exit
        </div>
      </div>
    )
  }

  // ── Normal Editor Layout ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0 bg-panel">
        {/* Mobile panel toggles */}
        <button
          className="lg:hidden text-gray-600 hover:text-white text-base px-1 shrink-0"
          onClick={() => { setLeftOpen((v) => !v); setRightOpen(false) }}
          title="Tools"
        >
          ☰
        </button>

        <button onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-300 text-[13px] transition-colors shrink-0 hidden sm:flex items-center gap-1.5">
          ← Dashboard
        </button>
        <div className="w-px h-4 bg-border shrink-0 hidden sm:block" />

        {/* Board name — click to rename */}
        {editingName ? (
          <input
            autoFocus
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
            className="bg-surface border border-lime/60 rounded-lg px-2.5 py-1 text-[13px] text-white outline-none font-semibold w-44"
          />
        ) : (
          <button onClick={() => setEditingName(true)}
            title="Click to rename"
            className="text-[13px] font-semibold text-gray-100 hover:text-lime transition-colors truncate max-w-[9rem] sm:max-w-xs">
            {board.name}
          </button>
        )}

        {/* Team badge */}
        {team && (
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color }} />
            <span className="text-[12px] text-gray-500 truncate max-w-[90px]">{team.name}</span>
            <span className="text-[10px] text-gray-700 bg-surface rounded-md px-1.5 py-0.5 font-medium border border-border">
              {team.format}
            </span>
          </div>
        )}

        <div className="flex-1" />

        {/* Phase badge */}
        <div className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full hidden sm:flex items-center gap-1.5"
          style={{
            backgroundColor: phaseInfo.color + '1a',
            color: phaseInfo.color,
            border: `1px solid ${phaseInfo.color}33`,
          }}>
          {phaseInfo.icon} {phaseInfo.label}
        </div>

        {/* Export */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowExport((v) => !v)}
            title="Export board"
            className="text-[13px] bg-surface border border-border text-gray-400 hover:text-white hover:border-gray-500 px-3 py-1.5 rounded-lg transition-all"
          >
            ↑ Export
          </button>
          {showExport && (
            <ExportMenu
              canvasRef={fieldCanvasRef}
              boardName={board.name}
              phaseName={phaseInfo.label}
              onClose={() => setShowExport(false)}
              onExportPlaybook={exportPlaybook}
            />
          )}
        </div>

        <button onClick={() => setPresentMode(true)}
          title="Enter presentation mode (full screen)"
          className="shrink-0 text-[13px] bg-lime text-black font-bold px-3.5 py-1.5 rounded-lg hover:bg-lime-dark transition-colors shadow-glow-lime shadow-sm">
          ▶ Present
        </button>

        {/* Mobile right panel toggle */}
        <button
          className="lg:hidden text-gray-600 hover:text-white text-base px-1 shrink-0"
          onClick={() => { setRightOpen((v) => !v); setLeftOpen(false) }}
          title="Roster"
        >
          👥
        </button>
      </div>

      {/* ── Main 3-panel layout ── */}
      <div className="flex flex-1 min-h-0 relative">

        {/* Mobile backdrop */}
        {(leftOpen || rightOpen) && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-10"
            onClick={() => { setLeftOpen(false); setRightOpen(false) }}
          />
        )}

        {/* Left panel */}
        <div className={`
          border-r border-border bg-panel shrink-0 z-20
          lg:relative lg:translate-x-0 lg:block
          ${leftOpen ? 'fixed left-0 top-0 h-full' : 'hidden lg:block'}
        `}>
          <LeftPanel
            boardId={boardId}
            phaseKey={currentPhase}
            onPhaseChange={handlePhaseChange}
            onClearTele={() => setConfirmClear(true)}
            onUndo={() => undoTele(boardId, currentPhase)}
            onRedo={() => redoTele(boardId, currentPhase)}
            onFlipSides={handleFlipSides}
            onDuplicatePhase={() => setShowDupPhase(true)}
          />
        </div>

        {/* Field canvas */}
        <div className="flex-1 min-w-0 relative">
          <div
            className="w-full h-full transition-opacity duration-150"
            style={{ opacity: phaseOpacity }}
          >
            <FieldCanvas
              ref={fieldCanvasRef}
              boardId={boardId}
              phaseKey={currentPhase}
              presentMode={false}
            />
          </div>
        </div>

        {/* Right panel */}
        <div className={`
          border-l border-border bg-panel shrink-0 z-20
          lg:relative lg:translate-x-0 lg:block
          ${rightOpen ? 'fixed right-0 top-0 h-full' : 'hidden lg:block'}
        `}>
          <RightPanel boardId={boardId} phaseKey={currentPhase} />
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 border-t border-border bg-panel shrink-0">
        <span className="text-[10px] text-gray-700 flex items-center gap-2 flex-wrap">
          {[
            ['S', 'Select'], ['A', 'Arrow'], ['F', 'Freehand'],
            ['Z', 'Zone'], ['T', 'Text'], ['E', 'Eraser'],
            ['Ctrl+Z', 'Undo'], ['Esc', 'Cancel'],
          ].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1">
              <kbd className="bg-surface border border-border rounded px-1 py-px text-gray-600 font-mono text-[9px]">{key}</kbd>
              <span className="text-gray-700">{label}</span>
            </span>
          ))}
        </span>
        <div className="flex-1" />
        <span className="text-[10px] text-gray-700 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-lime/60 inline-block" />
          Auto-saved
        </span>
      </div>

      {/* ── Modals & Overlays ── */}

      {/* Clear telestration confirm */}
      {confirmClear && (
        <ConfirmModal
          title="Clear All Annotations"
          message={`Remove all drawings from the ${phaseInfo.label} phase? This can be undone with Ctrl+Z.`}
          confirmLabel="Clear"
          danger
          onConfirm={() => {
            clearTele(boardId, currentPhase)
            setConfirmClear(false)
            showToast('Annotations cleared')
          }}
          onCancel={() => setConfirmClear(false)}
        />
      )}

      {/* Copy-phase-on-switch confirm */}
      {confirmPhase && (
        <ConfirmModal
          title={`Switch to ${PHASES.find((p) => p.key === confirmPhase)?.label}`}
          message={`This phase is empty. Copy player positions from ${phaseInfo.label}?`}
          confirmLabel="Copy & Switch"
          cancelLabel="Switch Empty"
          onConfirm={handleConfirmPhaseCopy}
          onCancel={() => { animatePhaseChange(confirmPhase); setConfirmPhase(null) }}
        />
      )}

      {/* Duplicate phase modal */}
      {showDupPhase && (
        <DuplicatePhaseModal
          currentPhase={currentPhase}
          boardId={boardId}
          onClose={() => setShowDupPhase(false)}
        />
      )}

      {/* Playbook export overlay */}
      {exportingPlaybook && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[300]">
          <div className="bg-panel border border-border rounded-2xl p-7 text-center shadow-2xl min-w-[220px]">
            <div className="text-3xl mb-3 animate-spin inline-block">⟳</div>
            <div className="text-white font-bold text-base mb-1">Building Playbook…</div>
            <div className="text-gray-400 text-sm">{exportProgress || 'Preparing…'}</div>
            <div className="flex gap-1 justify-center mt-4">
              {PHASES.map((p) => (
                <div
                  key={p.key}
                  className="text-xs px-2 py-1 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: exportProgress.toLowerCase().includes(p.label.toLowerCase())
                      ? p.color + '44'
                      : 'transparent',
                    color: exportProgress.toLowerCase().includes(p.label.toLowerCase())
                      ? p.color
                      : '#555',
                    border: `1px solid ${exportProgress.toLowerCase().includes(p.label.toLowerCase()) ? p.color + '66' : '#333'}`,
                  }}
                >
                  {p.icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
