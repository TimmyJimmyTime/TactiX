import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store'
import ConfirmModal from '../components/modals/ConfirmModal'

const FORMAT_LABELS = { '11v11': '11v11', '9v9': '9v9', '7v7': '7v7' }
const FORMAT_COLORS = { '11v11': '#88C66F', '9v9': '#3b82f6', '7v7': '#a855f7' }

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000)  return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── New Team Modal ─────────────────────────────────────────────────────────────
function NewTeamModal({ onClose }) {
  const [name,   setName]   = useState('')
  const [format, setFormat] = useState('11v11')
  const [color,  setColor]  = useState('#3b82f6')
  const navigate = useNavigate()
  const addTeam  = useStore((s) => s.addTeam)
  const setCurrentTeamId = useStore((s) => s.setCurrentTeamId)

  const submit = () => {
    if (!name.trim()) return
    const id = addTeam({ name: name.trim(), format, color })
    setCurrentTeamId(id)
    onClose()
    navigate(`/teams/${id}`)
  }

  const COLORS = ['#3b82f6','#ef4444','#88C66F','#f59e0b','#a855f7','#ec4899','#0ea5e9','#ffffff','#e53e3e','#f97316']

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-sm shadow-panel mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-bold text-white mb-5">New Team</h2>
        <div className="flex flex-col gap-4">
          <input
            autoFocus
            placeholder="Team name (e.g. U13 Girls Red)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-gray-500 transition-colors placeholder-gray-700"
          />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600 mb-2">Format</div>
            <div className="flex gap-2">
              {['7v7','9v9','11v11'].map((f) => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-medium border transition-all
                    ${format === f
                      ? 'border-lime text-lime bg-lime/10'
                      : 'border-border text-gray-500 hover:border-gray-500 hover:text-gray-300'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600 mb-2">Jersey Colour</div>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110
                    ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c, outline: c === '#ffffff' ? '1px solid #444' : 'none' }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={submit}
            className="flex-1 bg-lime text-black font-bold py-2.5 rounded-xl hover:bg-lime-dark transition-colors text-[13px]">
            Create Team
          </button>
          <button onClick={onClose}
            className="flex-1 bg-surface text-gray-500 py-2.5 rounded-xl hover:bg-panel-light transition-colors text-[13px] border border-border">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── New Board Modal ────────────────────────────────────────────────────────────
function NewBoardModal({ onClose, defaultTeamId }) {
  const [name,   setName]   = useState('')
  const [teamId, setTeamId] = useState(defaultTeamId || '')
  const navigate = useNavigate()
  const teams    = useStore((s) => s.teams)
  const addBoard = useStore((s) => s.addBoard)
  const setCurrentBoardId = useStore((s) => s.setCurrentBoardId)

  const submit = () => {
    if (!name.trim() || !teamId) return
    const id = addBoard({ name: name.trim(), teamId })
    setCurrentBoardId(id)
    onClose()
    navigate(`/board/${id}`)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-sm shadow-panel mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-bold text-white mb-5">New Tactic Board</h2>
        <div className="flex flex-col gap-3">
          <input
            autoFocus
            placeholder="Board name (e.g. Week 5 vs Crossfire)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-gray-500 transition-colors placeholder-gray-700"
          />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600 mb-2">Team</div>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] text-white outline-none cursor-pointer"
            >
              <option value="">Select a team…</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.format})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={submit} disabled={!name.trim() || !teamId}
            className="flex-1 bg-lime text-black font-bold py-2.5 rounded-xl hover:bg-lime-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-[13px]">
            Create Board
          </button>
          <button onClick={onClose}
            className="flex-1 bg-surface text-gray-500 py-2.5 rounded-xl hover:bg-panel-light transition-colors text-[13px] border border-border">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Team Card ──────────────────────────────────────────────────────────────────
function TeamCard({ team, boardCount, playerCount, onNewBoard }) {
  const navigate = useNavigate()
  const fmtColor = FORMAT_COLORS[team.format] || '#6b7280'

  return (
    <div className="bg-panel border border-border rounded-2xl p-4 hover:border-gray-600 transition-all group cursor-default">
      <div className="flex items-center gap-3 mb-3">
        {/* Jersey color swatch */}
        <div
          className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-lg font-black"
          style={{ backgroundColor: team.color + '22', border: `2px solid ${team.color}55`, color: team.color }}
        >
          {team.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-white text-[13px] truncate">{team.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: fmtColor + '20', color: fmtColor }}
            >
              {team.format}
            </span>
            <span className="text-[11px] text-gray-600">
              {playerCount} player{playerCount !== 1 ? 's' : ''} · {boardCount} board{boardCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => navigate(`/teams/${team.id}`)}
          className="flex-1 text-[12px] py-1.5 rounded-lg bg-surface text-gray-400 hover:text-white hover:bg-panel-light border border-border hover:border-gray-600 transition-all">
          Manage Roster
        </button>
        <button onClick={() => onNewBoard(team.id)}
          className="flex-1 text-[12px] py-1.5 rounded-lg bg-lime/10 text-lime hover:bg-lime hover:text-black font-semibold border border-lime/20 hover:border-lime transition-all">
          + New Board
        </button>
      </div>
    </div>
  )
}

// ── Board Row ──────────────────────────────────────────────────────────────────
function BoardRow({ board, team, onDelete, onDuplicate }) {
  const navigate = useNavigate()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-panel-light transition-colors group border-b border-border last:border-0">
      {/* Team color indicator */}
      <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: team?.color || '#444' }} />

      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-gray-100 truncate">{board.name}</div>
        <div className="text-[11px] text-gray-600 truncate">
          {team?.name} · {formatDate(board.updatedAt)}
        </div>
      </div>

      {/* Hover actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onDuplicate(board.id)}
          title="Duplicate"
          className="text-[12px] text-gray-600 hover:text-lime px-2 py-1 rounded-lg hover:bg-surface transition-colors"
        >
          ⎘
        </button>
        <button onClick={() => setConfirmingDelete(true)}
          title="Delete"
          className="text-[12px] text-gray-700 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-surface transition-colors">
          🗑
        </button>
      </div>

      <button onClick={() => navigate(`/board/${board.id}`)}
        className="shrink-0 text-[12px] bg-surface border border-border text-gray-400 hover:text-white hover:border-gray-500 hover:bg-panel-light px-3 py-1.5 rounded-lg font-medium transition-all">
        Open →
      </button>

      {confirmingDelete && (
        <ConfirmModal
          title="Delete Board"
          message={`Delete "${board.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => { onDelete(board.id); setConfirmingDelete(false) }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [showNewTeam,  setShowNewTeam]  = useState(false)
  const [newBoardTeam, setNewBoardTeam] = useState(null)
  const [dupBoardId,   setDupBoardId]   = useState(null)
  const [dupName,      setDupName]      = useState('')

  const teams        = useStore((s) => s.teams)
  const players      = useStore((s) => s.players)
  const boards       = useStore((s) => s.boards)
  const deleteBoard  = useStore((s) => s.deleteBoard)
  const duplicateBoard = useStore((s) => s.duplicateBoard)
  const showToast    = useStore((s) => s.showToast)
  const navigate     = useNavigate()

  const recentBoards = [...boards]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 8)

  const handleDuplicate = (boardId) => {
    const src = boards.find((b) => b.id === boardId)
    setDupBoardId(boardId)
    setDupName(`${src?.name || 'Board'} (copy)`)
  }

  const confirmDuplicate = () => {
    if (!dupBoardId) return
    const newId = duplicateBoard(dupBoardId, dupName)
    setDupBoardId(null)
    showToast('Board duplicated ✓')
    navigate(`/board/${newId}`)
  }

  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-lime tracking-tight">TactiX</span>
          <span className="text-[10px] font-semibold text-gray-600 border border-border rounded-lg px-2 py-0.5 uppercase tracking-wider hidden sm:inline">
            Coach Board
          </span>
        </div>
        <button onClick={() => setShowNewTeam(true)}
          className="text-[13px] bg-lime text-black font-bold px-4 py-2 rounded-xl hover:bg-lime-dark transition-colors shadow-glow-lime shadow-sm">
          + New Team
        </button>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-6 max-w-5xl w-full mx-auto">

        {/* ── Empty state ── */}
        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-lime/10 border border-lime/20 flex items-center justify-center text-3xl mb-5">
              ⚽
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Welcome to TactiX</h1>
            <p className="text-[13px] text-gray-500 mb-6 max-w-xs leading-relaxed">
              Create your first team to build formations, plan tactics, and draw up plays.
            </p>
            <button onClick={() => setShowNewTeam(true)}
              className="bg-lime text-black font-bold px-8 py-2.5 rounded-xl hover:bg-lime-dark transition-colors">
              Create Your First Team
            </button>
          </div>
        ) : (
          <>
            {/* ── Teams section ── */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Your Teams</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  boardCount={boards.filter((b) => b.teamId === team.id).length}
                  playerCount={(players[team.id] || []).length}
                  onNewBoard={(tid) => setNewBoardTeam(tid)}
                />
              ))}
            </div>

            {/* ── Recent Boards ── */}
            {recentBoards.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Recent Boards</h2>
                  <button onClick={() => setNewBoardTeam('')}
                    className="text-[12px] text-lime hover:underline">
                    + New Board
                  </button>
                </div>
                <div className="bg-panel border border-border rounded-2xl overflow-hidden">
                  {recentBoards.map((b) => (
                    <BoardRow
                      key={b.id}
                      board={b}
                      team={teams.find((t) => t.id === b.teamId)}
                      onDelete={deleteBoard}
                      onDuplicate={handleDuplicate}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Empty boards state */}
            {boards.length === 0 && (
              <div className="bg-panel border border-dashed border-border rounded-2xl p-10 text-center">
                <div className="text-3xl mb-3">📋</div>
                <div className="text-white font-semibold mb-1">No boards yet</div>
                <div className="text-[13px] text-gray-500 mb-4">Create a tactic board to start planning</div>
                <button onClick={() => setNewBoardTeam('')}
                  className="bg-lime/10 text-lime font-bold px-6 py-2 rounded-xl hover:bg-lime hover:text-black transition-colors border border-lime/20">
                  + New Board
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {showNewTeam && <NewTeamModal onClose={() => setShowNewTeam(false)} />}
      {newBoardTeam !== null && (
        <NewBoardModal onClose={() => setNewBoardTeam(null)} defaultTeamId={newBoardTeam} />
      )}

      {/* Duplicate board modal */}
      {dupBoardId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDupBoardId(null)}>
          <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-sm shadow-panel mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-white mb-1">Duplicate Board</h2>
            <p className="text-[12px] text-gray-500 mb-4">Give the copy a name</p>
            <input
              autoFocus
              value={dupName}
              onChange={(e) => setDupName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmDuplicate(); if (e.key === 'Escape') setDupBoardId(null) }}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-gray-500 transition-colors mb-4"
            />
            <div className="flex gap-2">
              <button onClick={confirmDuplicate}
                className="flex-1 bg-lime text-black font-bold py-2.5 rounded-xl hover:bg-lime-dark transition-colors text-[13px]">
                Duplicate
              </button>
              <button onClick={() => setDupBoardId(null)}
                className="flex-1 bg-surface text-gray-500 py-2.5 rounded-xl hover:bg-panel-light transition-colors text-[13px] border border-border">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
