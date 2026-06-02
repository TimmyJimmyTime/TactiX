import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import useStore from '../../store'

const POSITION_COLORS = {
  GK: '#f59e0b', CB: '#3b82f6', RB: '#3b82f6', LB: '#3b82f6',
  RWB: '#60a5fa', LWB: '#60a5fa', SW: '#3b82f6',
  CDM: '#88C66F', CM: '#88C66F', CAM: '#88C66F',
  RM: '#88C66F', LM: '#88C66F', DM: '#88C66F',
  RW: '#a855f7', LW: '#a855f7', SS: '#a855f7',
  ST: '#ef4444', CF: '#ef4444', FW: '#ef4444',
}
const posColor = (pos) => POSITION_COLORS[pos] || '#52566a'

// ── Player row ─────────────────────────────────────────────────────────────────
function PlayerRow({ player, isOnField, isPlacing, onPlace, onRemove }) {
  const handleDragStart = (e) => {
    if (isOnField) return
    e.dataTransfer.setData('application/tactix-player', player.id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div
      draggable={!isOnField}
      onDragStart={handleDragStart}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 group transition-all duration-100
        ${isPlacing  ? 'bg-lime/15 border border-lime/40' : ''}
        ${isOnField  ? 'bg-panel-light/60' : 'hover:bg-panel-light'}
        ${!isOnField ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Drag handle */}
      {!isOnField && (
        <span className="text-gray-700 text-xs leading-none opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          ⠿
        </span>
      )}

      {/* Position badge */}
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 text-white"
        style={{ backgroundColor: posColor(player.positions?.[0]) }}
      >
        {player.number || '?'}
      </div>

      {/* Name + position */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-gray-100 truncate leading-tight">{player.name}</div>
        {player.positions?.length > 0 && (
          <div className="text-[10px] text-gray-600 leading-tight">{player.positions.join(' · ')}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!isOnField && (
          <button
            onClick={onPlace}
            title="Click to place on field"
            className="text-xs px-1.5 py-0.5 rounded font-bold leading-none" style={{ color: '#88C66F' }}
          >
            +
          </button>
        )}
        {isOnField && (
          <button
            onClick={onRemove}
            title="Remove from field"
            className="text-red-500 text-xs px-1.5 py-0.5 rounded hover:bg-red-900/20 leading-none"
          >
            ✕
          </button>
        )}
      </div>

      {/* On-field indicator */}
      {isOnField && (
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#88C66F', boxShadow: '0 0 0 3px rgba(136,198,111,0.16)' }} title="On field" />
      )}
    </div>
  )
}

// ── Opponents tab ──────────────────────────────────────────────────────────────
function OpponentsTab({ boardId, phaseKey }) {
  const getPhase  = useStore((s) => s.getPhaseState)
  const addOpp    = useStore((s) => s.addOpponent)
  const removeOpp = useStore((s) => s.removeOpponent)
  const setPhaseOpponentSlots = useStore((s) => s.setPhaseOpponentSlots)

  const phaseState = getPhase(boardId, phaseKey)
  const opponents  = phaseState.opponentSlots || []

  function clamp(v) { return Math.min(0.95, Math.max(0.05, v)) }

  const addAll = (count) => {
    const existing = opponents.map((o) => o.number)
    const slots = []
    let num = 1
    while (slots.length < count) {
      if (!existing.includes(num)) {
        slots.push({ id: uuid(), number: num, x: clamp(0.2 + (slots.length % 4) * 0.15), y: clamp(0.12 + Math.floor(slots.length / 4) * 0.15) })
      }
      num++
    }
    setPhaseOpponentSlots(boardId, phaseKey, [...opponents, ...slots])
  }

  const addOne = () => {
    const nums = new Set(opponents.map((o) => o.number))
    let n = 1
    while (nums.has(n)) n++
    addOpp(boardId, phaseKey, {
      id: uuid(), number: n,
      x: clamp(0.35 + (opponents.length % 5) * 0.07),
      y: clamp(0.08 + Math.floor(opponents.length / 5) * 0.15),
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Quick-add row */}
      <div className="px-3 py-2.5 border-b border-border">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600 mb-2">Add opponents</div>
        <div className="flex gap-1 flex-wrap">
          {[5, 9, 11].map((n) => (
            <button key={n} onClick={() => addAll(n)}
              className="text-xs px-2.5 py-1.5 bg-panel-light border border-border rounded-lg text-red-400 hover:bg-red-950/30 hover:border-red-900 transition-all font-medium">
              +{n}v{n}
            </button>
          ))}
          <button onClick={addOne}
            className="text-xs px-2.5 py-1.5 bg-panel-light border border-border rounded-lg text-gray-400 hover:text-white hover:bg-border transition-all">
            +1
          </button>
          {opponents.length > 0 && (
            <button onClick={() => setPhaseOpponentSlots(boardId, phaseKey, [])}
              className="text-xs px-2.5 py-1.5 bg-panel-light border border-border rounded-lg text-gray-600 hover:text-red-400 transition-colors ml-auto">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Opponent list */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {opponents.length === 0 ? (
          <div className="text-xs text-gray-700 text-center py-8 leading-relaxed">
            No opponents on field
            <br />
            <span className="text-gray-600">Use buttons above to add them.</span>
          </div>
        ) : (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600 mb-2">
              On field ({opponents.length})
            </div>
            <div className="space-y-0.5">
              {[...opponents].sort((a, b) => a.number - b.number).map((opp) => (
                <div key={opp.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-panel-light group transition-colors">
                  <div className="w-5 h-5 border-2 border-red-600 bg-red-950/40 rotate-45 shrink-0 flex items-center justify-center">
                    <span className="text-[9px] text-red-400 font-bold -rotate-45">{opp.number}</span>
                  </div>
                  <span className="text-[13px] text-gray-400 flex-1">#{opp.number}</span>
                  <button
                    onClick={() => removeOpp(boardId, phaseKey, opp.id)}
                    className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-sm leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="px-3 py-2 border-t border-border">
        <p className="text-[10px] text-gray-700 leading-relaxed">
          Drag opponents on the field. Right-click to remove.
        </p>
      </div>
    </div>
  )
}

// ── Main RightPanel ────────────────────────────────────────────────────────────
export default function RightPanel({ boardId, phaseKey }) {
  const [tab,     setTab]     = useState('roster')
  const [search,  setSearch]  = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newPlayer, setNewPlayer] = useState({ name: '', number: '', positions: '' })

  const navigate   = useNavigate()
  const boards     = useStore((s) => s.boards)
  const players    = useStore((s) => s.players)
  const getPhase   = useStore((s) => s.getPhaseState)
  const placingId  = useStore((s) => s.placingPlayerId)
  const setPlacing = useStore((s) => s.setPlacingPlayerId)
  const setPhaseSlots = useStore((s) => s.setPhasePlayerSlots)
  const addPlayer  = useStore((s) => s.addPlayer)
  const showToast  = useStore((s) => s.showToast)

  const board = boards.find((b) => b.id === boardId)
  if (!board) return null

  const teamId     = board.teamId
  const roster     = (players[teamId] || []).filter((p) => p.isActive !== false)
  const phaseState = getPhase(boardId, phaseKey)
  const slots      = phaseState.playerSlots || []
  const onFieldIds = new Set(slots.map((s) => s.playerId).filter(Boolean))

  const filtered   = roster.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    String(p.number).includes(search) ||
    (p.positions || []).some((pos) => pos.toLowerCase().includes(search.toLowerCase()))
  )

  const onField    = filtered.filter((p) =>  onFieldIds.has(p.id))
  const available  = filtered.filter((p) => !onFieldIds.has(p.id))

  const handlePlace = (player) => setPlacing(placingId === player.id ? null : player.id)

  const handleRemove = (player) => {
    const newSlots = slots.map((s) => s.playerId === player.id ? { ...s, playerId: null } : s)
    setPhaseSlots(boardId, phaseKey, newSlots)
    showToast('Player removed')
  }

  const handleAddPlayer = () => {
    if (!newPlayer.name.trim()) return
    addPlayer(teamId, {
      name:      newPlayer.name.trim(),
      number:    parseInt(newPlayer.number) || null,
      positions: newPlayer.positions.split(/[,/\s]+/).map((s) => s.toUpperCase().trim()).filter(Boolean),
    })
    setNewPlayer({ name: '', number: '', positions: '' })
    setShowAdd(false)
    showToast('Player added ✓')
  }

  return (
    <div className="h-full flex flex-col bg-panel" style={{ minWidth: 210, maxWidth: 228 }}>

      {/* ── Tabs ── */}
      <div className="flex border-b border-border shrink-0">
        {[
          { id: 'roster',    label: 'My Team' },
          { id: 'opponents', label: 'Opponents' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors`}
            style={tab === t.id
              ? { color: '#88C66F', borderBottom: '2px solid #88C66F' }
              : { color: '#5E6A63', borderBottom: '2px solid transparent' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Opponents tab ── */}
      {tab === 'opponents' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <OpponentsTab boardId={boardId} phaseKey={phaseKey} />
        </div>
      )}

      {/* ── Roster tab ── */}
      {tab === 'roster' && (
        <>
          {/* Header */}
          <div className="px-3 pt-2.5 pb-2 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600">Roster</span>
              <button
                onClick={() => navigate(`/teams/${teamId}`)}
                className="text-[10px] transition-colors" style={{ color: '#5E6A63' }}
                onMouseEnter={e => e.currentTarget.style.color='#88C66F'}
                onMouseLeave={e => e.currentTarget.style.color='#5E6A63'}
              >
                Edit ↗
              </button>
            </div>
            <input
              type="text"
              placeholder="Search players…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-[13px] text-white placeholder-gray-700 outline-none focus:border-gray-500 transition-colors"
            />
          </div>

          {/* Player list */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {roster.length === 0 && (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-xs text-gray-600 mb-2">No players yet.</div>
                <button onClick={() => setShowAdd(true)}
                  className="text-xs text-lime hover:underline">Add your first player →</button>
              </div>
            )}

            {/* Drag hint */}
            {available.length > 0 && (
              <div className="text-[10px] text-gray-700 italic px-1 mb-2 flex items-center gap-1">
                <span>⠿</span> Drag onto the field
              </div>
            )}

            {/* On field */}
            {onField.length > 0 && (
              <>
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] px-1 mb-1" style={{ color: '#88C66F' }}>
                  On Field ({onField.length})
                </div>
                {onField.map((p) => (
                  <PlayerRow
                    key={p.id} player={p}
                    isOnField isPlacing={false}
                    onPlace={() => handlePlace(p)}
                    onRemove={() => handleRemove(p)}
                  />
                ))}
                <div className="my-2 border-t border-border" />
              </>
            )}

            {/* Available */}
            {roster.length > 0 && (
              <>
                <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-[0.1em] px-1 mb-1">
                  Available ({available.length})
                </div>
                {available.length === 0 && (
                  <div className="text-xs text-gray-700 px-2 py-2 italic">All players on field ✓</div>
                )}
                {available.map((p) => (
                  <PlayerRow
                    key={p.id} player={p}
                    isOnField={false}
                    isPlacing={placingId === p.id}
                    onPlace={() => handlePlace(p)}
                    onRemove={() => handleRemove(p)}
                  />
                ))}
              </>
            )}
          </div>

          {/* Add player quick form */}
          <div className="border-t border-border px-3 py-2.5 shrink-0">
            {showAdd ? (
              <div className="flex flex-col gap-1.5 animate-fade-in">
                <input
                  autoFocus
                  placeholder="Full name *"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer((p) => ({ ...p, name: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                  className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-[13px] text-white placeholder-gray-700 outline-none focus:border-gray-500 transition-colors"
                />
                <div className="flex gap-1.5">
                  <input
                    placeholder="#"
                    value={newPlayer.number}
                    onChange={(e) => setNewPlayer((p) => ({ ...p, number: e.target.value }))}
                    className="w-12 bg-surface border border-border rounded-lg px-2 py-1.5 text-[13px] text-white outline-none"
                  />
                  <input
                    placeholder="CM, CB…"
                    value={newPlayer.positions}
                    onChange={(e) => setNewPlayer((p) => ({ ...p, positions: e.target.value }))}
                    className="flex-1 bg-surface border border-border rounded-lg px-2 py-1.5 text-[13px] text-white outline-none"
                  />
                </div>
                <div className="flex gap-1.5">
                  <button onClick={handleAddPlayer}
                    className="flex-1 bg-lime text-black text-xs font-bold py-1.5 rounded-lg hover:bg-lime-dark transition-colors">
                    Add Player
                  </button>
                  <button onClick={() => setShowAdd(false)}
                    className="flex-1 bg-panel-light text-gray-500 text-xs py-1.5 rounded-lg hover:bg-border transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAdd(true)}
                className="w-full text-[13px] text-gray-600 hover:text-lime py-0.5 transition-colors flex items-center gap-1 justify-center">
                <span className="text-base leading-none">+</span> Add Player
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
