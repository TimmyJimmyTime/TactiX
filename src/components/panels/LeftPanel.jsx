import { useState, useCallback } from 'react'
import useStore from '../../store'
import { getFormationNames, getFormationSlots, migrateSlots } from '../../utils/formations'
import FormationBuilderModal from '../modals/FormationBuilderModal'
import ConfirmModal from '../modals/ConfirmModal'

const PHASES = [
  { key: 'attack',    label: 'Attack',      icon: '⚔️',  color: '#22c55e' },
  { key: 'defense',   label: 'Defense',     icon: '🛡️',  color: '#3b82f6' },
  { key: 'off_trans', label: 'Off. Trans.', icon: '⚡',  color: '#f59e0b' },
  { key: 'def_trans', label: 'Def. Trans.', icon: '↩️',  color: '#ef4444' },
]

const TOOLS = [
  { id: 'select',        icon: '↖', tip: 'Select / move players (S)' },
  { id: 'arrow',         icon: '↗', tip: 'Run Arrow — draw path, auto-smooths (A)' },
  { id: 'straight_arrow',icon: '→', tip: 'Pass Arrow — straight A→B (P)' },
  { id: 'zone',          icon: '▭', tip: 'Zone — drag to highlight area (Z)' },
  { id: 'freehand',      icon: '✏', tip: 'Freehand pencil — no arrowhead (F)' },
  { id: 'text',          icon: 'T', tip: 'Text label — click to place (T)' },
  { id: 'eraser',        icon: '⌫', tip: 'Eraser — click or drag to erase (E)' },
]

const COLORS  = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7','#ffffff','#000000']
const WEIGHTS  = ['thin','medium','thick']
const THEMES   = ['classic','dark','whiteboard']

// ── Section heading ────────────────────────────────────────────────────────────
function Section({ title, children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600 mb-2.5 px-0.5">
        {title}
      </div>
      {children}
    </div>
  )
}

// ── Main LeftPanel ─────────────────────────────────────────────────────────────
export default function LeftPanel({ boardId, phaseKey, onPhaseChange, onClearTele, onUndo, onRedo, onFlipSides, onDuplicatePhase }) {
  const [showBuilder, setShowBuilder]     = useState(false)
  const [editFormation, setEditFormation] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [notesOpen, setNotesOpen]         = useState(false)

  const boards              = useStore((s) => s.boards)
  const activeTool          = useStore((s) => s.activeTool)
  const toolOptions         = useStore((s) => s.toolOptions)
  const viewOptions         = useStore((s) => s.viewOptions)
  const fieldTheme          = useStore((s) => s.fieldTheme)
  const customFormations    = useStore((s) => s.customFormations)
  const undoStacks          = useStore((s) => s.undoStacks)
  const redoStacks          = useStore((s) => s.redoStacks)
  const getPhaseState       = useStore((s) => s.getPhaseState)
  const setActiveTool       = useStore((s) => s.setActiveTool)
  const setToolOptions      = useStore((s) => s.setToolOptions)
  const setViewOptions      = useStore((s) => s.setViewOptions)
  const setFieldTheme       = useStore((s) => s.setFieldTheme)
  const setPhasePlayerSlots = useStore((s) => s.setPhasePlayerSlots)
  const deleteCustomFormation = useStore((s) => s.deleteCustomFormation)
  const setPhaseNote        = useStore((s) => s.setPhaseNote)
  const phaseNotes          = useStore((s) => s.phaseNotes)
  const currentNote         = phaseNotes?.[boardId]?.[phaseKey] || ''

  const board  = boards.find((b) => b.id === boardId)
  const format = board?.format || '11v11'
  const formationNames   = getFormationNames(format, customFormations)
  const phaseState       = getPhaseState(boardId, phaseKey)
  const currentFormation = board?.formation || formationNames[0] || '4-3-3'

  const undoKey = `${boardId}_${phaseKey}`
  const canUndo = (undoStacks[undoKey] || []).length > 0
  const canRedo = (redoStacks[undoKey] || []).length > 0

  const isCustomFormation = (name) => !!(customFormations[format]?.[name])

  const applyFormation = (name) => {
    if (name === 'Custom') {
      setPhasePlayerSlots(boardId, phaseKey, [])
      useStore.getState().updateBoard(boardId, { formation: name })
      return
    }
    const newSlots = getFormationSlots(format, name, customFormations)
    const oldSlots = phaseState.playerSlots || []
    const merged   = migrateSlots(oldSlots, newSlots)
    setPhasePlayerSlots(boardId, phaseKey, merged)
    useStore.getState().updateBoard(boardId, { formation: name })
  }

  const handleBuilderClose = (savedName) => {
    setShowBuilder(false)
    setEditFormation(null)
    if (savedName) {
      applyFormation(savedName)
      useStore.getState().updateBoard(boardId, { formation: savedName })
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-panel flex flex-col gap-0 px-3 py-3 select-none"
      style={{ minWidth: 204, maxWidth: 222 }}>

      {/* ── Phase Tabs ── */}
      <Section title="Phase">
        <div className="flex flex-col gap-0.5">
          {PHASES.map((p) => (
            <button
              key={p.key}
              onClick={() => onPhaseChange(p.key)}
              title={`Switch to ${p.label} phase`}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                ${phaseKey === p.key
                  ? 'text-black font-semibold shadow-md'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-panel-light'}`}
              style={phaseKey === p.key ? { backgroundColor: p.color } : {}}
            >
              <span className="text-base leading-none">{p.icon}</span>
              <span className="flex-1 text-left text-[13px]">{p.label}</span>
              {phaseKey === p.key && onDuplicatePhase && (
                <span
                  role="button"
                  title="Copy phase to…"
                  onClick={(e) => { e.stopPropagation(); onDuplicatePhase() }}
                  className="text-xs opacity-50 hover:opacity-100 transition-opacity ml-0.5 leading-none"
                >
                  ⎘
                </span>
              )}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Formation ── */}
      <Section title="Formation">
        <div className="flex gap-1 mb-1.5">
          <select
            value={currentFormation}
            onChange={(e) => applyFormation(e.target.value)}
            className="flex-1 bg-panel-light border border-border rounded-lg px-2 py-1.5 text-[13px] text-white outline-none cursor-pointer hover:border-gray-500 transition-colors"
          >
            {formationNames.map((n) => (
              <option key={n} value={n}>
                {n}{isCustomFormation(n) ? ' ★' : ''}
              </option>
            ))}
          </select>

          {isCustomFormation(currentFormation) && (
            <button
              title="Edit formation"
              onClick={() => { setEditFormation(currentFormation); setShowBuilder(true) }}
              className="px-2 bg-panel-light border border-border rounded-lg text-gray-400 hover:text-lime hover:border-lime/50 transition-colors text-sm"
            >
              ✏
            </button>
          )}
          {isCustomFormation(currentFormation) && (
            <button
              title="Delete formation"
              onClick={() => setConfirmDelete(currentFormation)}
              className="px-2 bg-panel-light border border-border rounded-lg text-gray-400 hover:text-red-400 hover:border-red-800 transition-colors text-sm"
            >
              🗑
            </button>
          )}
        </div>

        <div className="flex gap-1">
          <button
            onClick={onFlipSides}
            title="Mirror player positions vertically"
            className="flex-1 text-xs py-1.5 rounded-lg border border-border text-gray-400 hover:bg-panel-light hover:text-gray-200 hover:border-gray-500 transition-all"
          >
            ⇅ Flip
          </button>
          <button
            onClick={() => { setEditFormation(null); setShowBuilder(true) }}
            title="Build a custom formation"
            className="flex-1 text-xs py-1.5 rounded-lg border border-lime/30 text-lime/70 hover:bg-lime/10 hover:text-lime hover:border-lime/60 transition-all"
          >
            + Custom
          </button>
        </div>
      </Section>

      {/* ── Divider ── */}
      <div className="border-t border-border mb-4 -mx-3" />

      {/* ── Telestration Tools ── */}
      <Section title="Draw">
        {/* Tool grid */}
        <div className="grid grid-cols-4 gap-1 mb-2">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              title={t.tip}
              onClick={() => setActiveTool(t.id)}
              className={`flex flex-col items-center justify-center py-2 rounded-lg text-base transition-all duration-100
                ${activeTool === t.id
                  ? 'bg-lime text-black shadow-md shadow-lime/20 font-bold'
                  : 'bg-panel-light text-gray-400 hover:bg-border hover:text-gray-200'}`}
            >
              <span className="leading-none">{t.icon}</span>
            </button>
          ))}
          {/* Clear all */}
          <button
            title="Clear all annotations"
            onClick={onClearTele}
            className="flex flex-col items-center justify-center py-2 rounded-lg text-base bg-panel-light text-gray-600 hover:text-red-400 hover:bg-red-950/40 transition-all"
          >
            🗑
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex gap-1 mb-2">
          <button
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
            className={`flex-1 text-xs py-1.5 rounded-lg transition-colors font-medium
              ${canUndo
                ? 'bg-panel-light text-gray-300 hover:bg-border hover:text-white'
                : 'bg-panel-light text-gray-700 cursor-not-allowed'}`}
          >
            ↩ Undo
          </button>
          <button
            onClick={onRedo}
            title="Redo (Ctrl+Y)"
            disabled={!canRedo}
            className={`flex-1 text-xs py-1.5 rounded-lg transition-colors font-medium
              ${canRedo
                ? 'bg-panel-light text-gray-300 hover:bg-border hover:text-white'
                : 'bg-panel-light text-gray-700 cursor-not-allowed'}`}
          >
            Redo →
          </button>
        </div>

        {/* Tool options — only when a draw tool is active */}
        {activeTool !== 'select' && activeTool !== 'eraser' && (
          <div className="animate-fade-in">
            {/* Color palette */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  title={c}
                  onClick={() => setToolOptions({ color: c })}
                  className={`w-5 h-5 rounded-full transition-all duration-100
                    ${toolOptions.color === c
                      ? 'ring-2 ring-white ring-offset-1 ring-offset-panel scale-110'
                      : 'opacity-70 hover:opacity-100 hover:scale-110'}`}
                  style={{
                    backgroundColor: c,
                    outline: c === '#ffffff' ? '1px solid #444' : 'none',
                  }}
                />
              ))}
            </div>

            {/* Stroke weight */}
            {activeTool !== 'text' && (
              <div className="flex gap-1 mb-2">
                {WEIGHTS.map((w) => (
                  <button
                    key={w}
                    title={`${w} stroke`}
                    onClick={() => setToolOptions({ weight: w })}
                    className={`flex-1 text-xs py-1.5 rounded-lg transition-colors
                      ${toolOptions.weight === w
                        ? 'bg-lime text-black font-bold'
                        : 'bg-panel-light text-gray-400 hover:bg-border hover:text-white'}`}
                  >
                    {w === 'thin' ? '—' : w === 'medium' ? '━' : '▬'}
                  </button>
                ))}
              </div>
            )}

            {/* Arrow style */}
            {(activeTool === 'arrow' || activeTool === 'straight_arrow') && (
              <div className="flex gap-1 mb-2">
                {['solid','dashed'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setToolOptions({ arrowStyle: s })}
                    className={`flex-1 text-xs py-1.5 rounded-lg transition-colors
                      ${toolOptions.arrowStyle === s
                        ? 'bg-lime text-black font-bold'
                        : 'bg-panel-light text-gray-400 hover:bg-border hover:text-white'}`}
                  >
                    {s === 'solid' ? '───▶' : '- -▶'}
                  </button>
                ))}
              </div>
            )}

            {/* Zone opacity */}
            {activeTool === 'zone' && (
              <div className="mb-2">
                <div className="text-[10px] text-gray-600 mb-1 flex justify-between">
                  <span>Opacity</span>
                  <span>{Math.round(toolOptions.opacity * 100)}%</span>
                </div>
                <input
                  type="range" min="0.05" max="0.7" step="0.05"
                  value={toolOptions.opacity}
                  onChange={(e) => setToolOptions({ opacity: parseFloat(e.target.value) })}
                  className="w-full accent-lime h-1"
                />
              </div>
            )}

            {/* Font size */}
            {activeTool === 'text' && (
              <div className="flex gap-1 mb-2">
                {['small','medium','large'].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setToolOptions({ fontSize: sz })}
                    className={`flex-1 text-xs py-1.5 rounded-lg transition-colors capitalize
                      ${toolOptions.fontSize === sz
                        ? 'bg-lime text-black font-bold'
                        : 'bg-panel-light text-gray-400 hover:bg-border hover:text-white'}`}
                  >
                    {sz === 'small' ? 'S' : sz === 'medium' ? 'M' : 'L'}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── Divider ── */}
      <div className="border-t border-border mb-4 -mx-3" />

      {/* ── View Options ── */}
      <Section title="View">
        {[
          { key: 'showNumbers',   label: 'Jersey numbers' },
          { key: 'showNames',     label: 'Player names' },
          { key: 'showPositions', label: 'Position labels' },
          { key: 'showGrid',      label: 'Position grid' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2.5 mb-2 cursor-pointer group">
            <button
              onClick={() => setViewOptions({ [key]: !viewOptions[key] })}
              className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-all shrink-0
                ${viewOptions[key]
                  ? 'bg-lime border-lime text-black shadow-glow-lime'
                  : 'border-border bg-panel-light text-transparent'}`}
            >
              ✓
            </button>
            <span className="text-[13px] text-gray-400 group-hover:text-gray-200 transition-colors">{label}</span>
          </label>
        ))}
      </Section>

      {/* ── Field Theme ── */}
      <Section title="Field">
        <select
          value={fieldTheme}
          onChange={(e) => setFieldTheme(e.target.value)}
          className="w-full bg-panel-light border border-border rounded-lg px-2 py-1.5 text-[13px] text-white outline-none cursor-pointer hover:border-gray-500 transition-colors"
        >
          {THEMES.map((th) => (
            <option key={th} value={th}>{th.charAt(0).toUpperCase() + th.slice(1)}</option>
          ))}
        </select>
      </Section>

      {/* ── Divider ── */}
      <div className="border-t border-border mb-4 -mx-3" />

      {/* ── Phase Notes ── */}
      <div className="mb-4">
        <button
          onClick={() => setNotesOpen((v) => !v)}
          className="w-full flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600 hover:text-gray-300 transition-colors px-0.5 mb-2"
        >
          <span className="flex items-center gap-1.5">
            Phase Notes
            {currentNote && !notesOpen && (
              <span className="w-1.5 h-1.5 rounded-full bg-lime flex-shrink-0" />
            )}
          </span>
          <span className={`transition-transform text-xs leading-none ${notesOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {notesOpen && (
          <div className="relative animate-fade-in">
            <textarea
              value={currentNote}
              onChange={(e) => setPhaseNote(boardId, phaseKey, e.target.value)}
              placeholder={`${PHASES.find(p => p.key === phaseKey)?.label} notes…`}
              rows={4}
              className="w-full bg-panel-light border border-border rounded-lg px-2.5 py-2 text-xs text-gray-200 placeholder-gray-700 outline-none focus:border-lime/60 resize-none leading-relaxed transition-colors"
            />
            {currentNote && (
              <div className="absolute bottom-2 right-2.5 text-[9px] text-gray-700 pointer-events-none">
                {currentNote.length}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Formation Builder Modal ── */}
      {showBuilder && (
        <FormationBuilderModal
          format={format}
          editingName={editFormation}
          onClose={handleBuilderClose}
        />
      )}

      {/* ── Delete Custom Formation Confirm ── */}
      {confirmDelete && (
        <ConfirmModal
          title="Delete Formation"
          message={`Delete "${confirmDelete}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            deleteCustomFormation(format, confirmDelete)
            setConfirmDelete(null)
            applyFormation(formationNames.find((n) => n !== confirmDelete) || '4-3-3')
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
