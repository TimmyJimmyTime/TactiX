import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useStore from '../store'

const POSITIONS_COMMON = ['GK','CB','RB','LB','RWB','LWB','CDM','CM','CAM','RM','LM','RW','LW','ST','CF']

function PlayerRow({ player, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name:      player.name,
    number:    String(player.number || ''),
    positions: (player.positions || []).join(', '),
  })

  const save = () => {
    onUpdate(player.id, {
      name:      form.name.trim(),
      number:    parseInt(form.number) || null,
      positions: form.positions.split(/[,/\s]+/).map((s) => s.toUpperCase().trim()).filter(Boolean),
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <tr className="border-b border-border bg-panel-light">
        <td className="px-3 py-2">
          <input value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
            className="w-14 bg-surface border border-border rounded-lg px-2 py-1 text-[12px] text-white outline-none focus:border-lime/60 transition-colors"
            placeholder="#"
          />
        </td>
        <td className="px-3 py-2">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-[12px] text-white outline-none focus:border-lime/60 transition-colors"
            placeholder="Full name"
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
        </td>
        <td className="px-3 py-2">
          <input value={form.positions} onChange={(e) => setForm((f) => ({ ...f, positions: e.target.value }))}
            className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-[12px] text-white outline-none focus:border-lime/60 transition-colors"
            placeholder="e.g. CM, CB"
          />
        </td>
        <td className="px-3 py-2">
          <div className="flex gap-1">
            <button onClick={save} className="text-xs text-lime hover:underline">Save</button>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-white">Cancel</button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-border hover:bg-panel-light group transition-colors">
      <td className="px-3 py-2 text-[13px] font-mono text-gray-400">{player.number || '—'}</td>
      <td className="px-3 py-2 text-[13px] text-white">{player.name}</td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {(player.positions || []).map((pos) => (
            <span key={pos} className="text-[10px] px-1.5 py-0.5 rounded bg-panel border border-border text-gray-300">
              {pos}
            </span>
          ))}
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-lime">Edit</button>
          <button onClick={() => onRemove(player.id)} className="text-xs text-gray-400 hover:text-red-400">Remove</button>
        </div>
      </td>
    </tr>
  )
}

export default function TeamManager() {
  const { teamId } = useParams()
  const navigate   = useNavigate()

  const teams      = useStore((s) => s.teams)
  const players    = useStore((s) => s.players)
  const updateTeam = useStore((s) => s.updateTeam)
  const addPlayer  = useStore((s) => s.addPlayer)
  const updatePlayer = useStore((s) => s.updatePlayer)
  const removePlayer = useStore((s) => s.removePlayer)

  const team   = teams.find((t) => t.id === teamId)
  const roster = (players[teamId] || []).slice().sort((a, b) => (a.number || 99) - (b.number || 99))

  const [editTeam, setEditTeam] = useState(false)
  const [teamForm, setTeamForm] = useState({ name: team?.name || '', color: team?.color || '#e53e3e', format: team?.format || '11v11' })
  const [newPlayer, setNewPlayer] = useState({ name: '', number: '', positions: '' })
  const [showAdd, setShowAdd] = useState(false)

  if (!team) return (
    <div className="flex items-center justify-center h-full text-gray-500">
      Team not found. <button onClick={() => navigate('/')} className="ml-2 text-lime hover:underline">← Dashboard</button>
    </div>
  )

  const saveTeam = () => {
    updateTeam(teamId, teamForm)
    setEditTeam(false)
  }

  const handleAddPlayer = () => {
    if (!newPlayer.name.trim()) return
    addPlayer(teamId, {
      name:      newPlayer.name.trim(),
      number:    parseInt(newPlayer.number) || null,
      positions: newPlayer.positions.split(/[,/\s]+/).map((s) => s.toUpperCase().trim()).filter(Boolean),
    })
    setNewPlayer({ name: '', number: '', positions: '' })
  }

  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border shrink-0">
        <button onClick={() => navigate('/')}
          className="text-gray-500 hover:text-white text-[13px] transition-colors flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Dashboard
        </button>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full border-2 border-white/20 shrink-0" style={{ backgroundColor: team.color }} />
          <span className="font-semibold text-white text-[15px]">{team.name}</span>
          <span className="text-[11px] font-semibold text-gray-500 bg-panel border border-border rounded-md px-2 py-0.5 uppercase tracking-[0.06em]">{team.format}</span>
        </div>
        <div className="flex-1" />
        <button onClick={() => setEditTeam(!editTeam)}
          className="text-sm text-gray-400 hover:text-white border border-border rounded-lg px-3 py-1.5 hover:border-gray-500 transition-colors">
          {editTeam ? 'Cancel' : 'Edit Team'}
        </button>
      </div>

      <div className="flex-1 px-6 py-5 max-w-3xl w-full mx-auto">
        {/* Edit team form */}
        {editTeam && (
          <div className="bg-panel border border-border rounded-xl p-4 mb-6">
            <h3 className="text-sm font-bold text-white mb-3">Team Settings</h3>
            <div className="flex flex-col gap-3">
              <input value={teamForm.name} onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-panel-light border border-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-lime"
                placeholder="Team name"
              />
              <div>
                <div className="text-xs text-gray-500 mb-1">Format</div>
                <div className="flex gap-2">
                  {['7v7','9v9','11v11'].map((f) => (
                    <button key={f} onClick={() => setTeamForm((tf) => ({ ...tf, format: f }))}
                      className={`flex-1 py-1.5 rounded-lg text-sm border transition-all
                        ${teamForm.format === f ? 'border-lime text-lime bg-lime/10' : 'border-border text-gray-400'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Jersey Colour</div>
                <div className="flex gap-2 flex-wrap">
                  {['#e53e3e','#3b82f6','#88C66F','#f59e0b','#a855f7','#ec4899','#0ea5e9','#ffffff','#1a1a1a','#f97316'].map((c) => (
                    <button key={c} onClick={() => setTeamForm((tf) => ({ ...tf, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${teamForm.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <button onClick={saveTeam}
                className="bg-lime text-black font-bold py-2 rounded-lg hover:bg-lime-dark transition-colors text-sm">
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Roster table */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-gray-400">Roster <span className="text-gray-600 font-normal normal-case tracking-normal">({roster.length})</span></h2>
          <button onClick={() => setShowAdd(!showAdd)}
            className="text-sm bg-lime/10 text-lime hover:bg-lime hover:text-black px-3 py-1.5 rounded-lg font-medium transition-colors">
            {showAdd ? 'Cancel' : '+ Add Player'}
          </button>
        </div>

        {/* Add player form */}
        {showAdd && (
          <div className="bg-panel border border-lime/30 rounded-xl p-4 mb-4">
            <div className="flex gap-2 mb-2">
              <input placeholder="#" value={newPlayer.number}
                onChange={(e) => setNewPlayer((p) => ({ ...p, number: e.target.value }))}
                className="w-16 bg-panel-light border border-border rounded-lg px-2 py-1.5 text-[13px] text-white outline-none focus:border-lime/60 transition-colors"
              />
              <input placeholder="Full name *" value={newPlayer.name}
                onChange={(e) => setNewPlayer((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                className="flex-1 bg-panel-light border border-border rounded-lg px-2 py-1.5 text-[13px] text-white outline-none focus:border-lime/60 transition-colors"
              />
              <input placeholder="Positions (CM, CB…)" value={newPlayer.positions}
                onChange={(e) => setNewPlayer((p) => ({ ...p, positions: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                className="w-40 bg-panel-light border border-border rounded-lg px-2 py-1.5 text-[13px] text-white outline-none focus:border-lime/60 transition-colors"
              />
              <button onClick={handleAddPlayer}
                className="bg-lime text-black font-bold px-4 py-1.5 rounded-lg hover:bg-lime-dark transition-colors text-[13px]">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {POSITIONS_COMMON.map((pos) => (
                <button key={pos}
                  onClick={() => setNewPlayer((p) => {
                    const existing = p.positions.split(/[,/\s]+/).map((s) => s.trim()).filter(Boolean)
                    if (existing.includes(pos)) return p
                    return { ...p, positions: [...existing, pos].join(', ') }
                  })}
                  className="text-[10px] px-2 py-0.5 rounded border border-border text-gray-400 hover:border-lime hover:text-lime transition-colors">
                  {pos}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Player table */}
        {roster.length === 0 ? (
          <div className="bg-panel border border-dashed border-border rounded-xl p-10 text-center">
            <div className="w-10 h-10 rounded-xl bg-panel-light border border-border flex items-center justify-center mx-auto mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
            <div className="text-[13px] text-white font-medium mb-1">No players yet</div>
            <div className="text-[12px] text-gray-500">Add players to build your roster</div>
          </div>
        ) : (
          <div className="bg-panel border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-14">#</th>
                  <th className="text-left px-3 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-3 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Positions</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody>
                {roster.map((p) => (
                  <PlayerRow
                    key={p.id}
                    player={p}
                    onUpdate={(id, data) => updatePlayer(teamId, id, data)}
                    onRemove={(id) => removePlayer(teamId, id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
