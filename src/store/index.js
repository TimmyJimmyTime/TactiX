import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'

// ── Helpers ───────────────────────────────────────────────────────────────────
// Snapshot the full current phase state for undo
function snapshotPhase(s, boardId, phase) {
  const cur = s.boardPhases?.[boardId]?.[phase] || {}
  return {
    playerSlots:   cur.playerSlots   ? [...cur.playerSlots]   : [],
    telestration:  cur.telestration  ? [...cur.telestration]  : [],
    opponentSlots: cur.opponentSlots ? [...cur.opponentSlots] : [],
  }
}

function withUndo(st, boardId, phase, nextPhaseData) {
  const key = `${boardId}_${phase}`
  const snapshot = snapshotPhase(st, boardId, phase)
  return {
    boardPhases: {
      ...st.boardPhases,
      [boardId]: {
        ...(st.boardPhases[boardId] || {}),
        [phase]: {
          ...(st.boardPhases[boardId]?.[phase] || {}),
          ...nextPhaseData,
        },
      },
    },
    undoStacks: {
      ...st.undoStacks,
      [key]: [...(st.undoStacks[key] || []), snapshot].slice(-50),
    },
    redoStacks: { ...st.redoStacks, [key]: [] },
  }
}

const useStore = create(
  persist(
    (set, get) => ({
      // ── Persistent data ──────────────────────────────────────────────────
      teams:            [],
      players:          {},   // { [teamId]: Player[] }
      boards:           [],
      boardPhases:      {},   // { [boardId]: { [phase]: { playerSlots, telestration, opponentSlots } } }
      viewOptions:      { showNames: true, showNumbers: true, showPositions: false, showGrid: false },
      fieldTheme:       'classic',
      customFormations: {},   // { [format]: { [name]: [{label, x, y}] } }
      phaseNotes:       {},   // { [boardId]: { [phase]: string } }

      // ── Session state (not persisted) ────────────────────────────────────
      currentTeamId:   null,
      currentBoardId:  null,
      currentPhase:    'attack',
      activeTool:      'select',
      placingPlayerId: null,
      toolOptions:     { color: '#ef4444', weight: 'medium', arrowStyle: 'solid', opacity: 0.35, fontSize: 'medium' },
      undoStacks:      {},
      redoStacks:      {},
      toast:           null,

      // ── Teams ─────────────────────────────────────────────────────────────
      addTeam: (data) => {
        const id = uuid()
        set((s) => ({ teams: [...s.teams, { id, createdAt: Date.now(), color: '#3b82f6', ...data }] }))
        return id
      },
      updateTeam: (id, data) =>
        set((s) => ({ teams: s.teams.map((t) => (t.id === id ? { ...t, ...data } : t)) })),
      deleteTeam: (id) =>
        set((s) => ({
          teams: s.teams.filter((t) => t.id !== id),
          boards: s.boards.filter((b) => b.teamId !== id),
          players: Object.fromEntries(Object.entries(s.players).filter(([k]) => k !== id)),
        })),

      // ── Players ───────────────────────────────────────────────────────────
      addPlayer: (teamId, data) => {
        const id = uuid()
        set((s) => ({
          players: { ...s.players, [teamId]: [...(s.players[teamId] || []), { id, isActive: true, ...data }] },
        }))
        return id
      },
      updatePlayer: (teamId, id, data) =>
        set((s) => ({
          players: {
            ...s.players,
            [teamId]: (s.players[teamId] || []).map((p) => (p.id === id ? { ...p, ...data } : p)),
          },
        })),
      removePlayer: (teamId, id) =>
        set((s) => ({
          players: { ...s.players, [teamId]: (s.players[teamId] || []).filter((p) => p.id !== id) },
        })),

      // ── Boards ────────────────────────────────────────────────────────────
      addBoard: (data) => {
        const id = uuid()
        const team = get().teams.find((t) => t.id === data.teamId)
        set((s) => ({
          boards: [...s.boards, {
            id,
            format: team?.format || '11v11',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...data,
          }],
        }))
        return id
      },
      updateBoard: (id, data) =>
        set((s) => ({
          boards: s.boards.map((b) => (b.id === id ? { ...b, ...data, updatedAt: Date.now() } : b)),
        })),
      deleteBoard: (id) =>
        set((s) => ({
          boards: s.boards.filter((b) => b.id !== id),
          boardPhases: Object.fromEntries(Object.entries(s.boardPhases).filter(([k]) => k !== id)),
        })),

      // Duplicate an entire board (all 4 phases)
      duplicateBoard: (boardId, newName) => {
        const s = get()
        const src = s.boards.find((b) => b.id === boardId)
        if (!src) return null
        const newId = uuid()
        const srcPhases = s.boardPhases[boardId] || {}
        const newPhases = Object.fromEntries(
          Object.entries(srcPhases).map(([phase, state]) => [
            phase,
            {
              playerSlots:   (state.playerSlots   || []).map((sl) => ({ ...sl, id: uuid() })),
              telestration:  (state.telestration  || []).map((t)  => ({ ...t,  id: uuid() })),
              opponentSlots: (state.opponentSlots || []).map((o)  => ({ ...o,  id: uuid() })),
            },
          ])
        )
        set((st) => ({
          boards: [...st.boards, {
            ...src,
            id: newId,
            name: newName || `${src.name} (copy)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }],
          boardPhases: { ...st.boardPhases, [newId]: newPhases },
        }))
        return newId
      },

      // ── Phase state ───────────────────────────────────────────────────────
      getPhaseState: (boardId, phase) => {
        const s = get()
        const state = s.boardPhases?.[boardId]?.[phase]
        if (!state) return { playerSlots: [], telestration: [], opponentSlots: [] }
        return { opponentSlots: [], ...state }
      },

      // Set player slots — also pushes undo
      setPhasePlayerSlots: (boardId, phase, playerSlots) =>
        set((s) => withUndo(s, boardId, phase, { playerSlots })),

      // Set opponent slots — also pushes undo
      setPhaseOpponentSlots: (boardId, phase, opponentSlots) =>
        set((s) => withUndo(s, boardId, phase, { opponentSlots })),

      addOpponent: (boardId, phase, opponent) => {
        const s = get()
        const cur = (s.boardPhases?.[boardId]?.[phase]?.opponentSlots) || []
        set((st) => withUndo(st, boardId, phase, { opponentSlots: [...cur, opponent] }))
      },

      removeOpponent: (boardId, phase, opponentId) => {
        const s = get()
        const cur = (s.boardPhases?.[boardId]?.[phase]?.opponentSlots) || []
        set((st) => withUndo(st, boardId, phase, { opponentSlots: cur.filter((o) => o.id !== opponentId) }))
      },

      // Duplicate one phase to another (or to a new board — omit targetBoardId to copy within same board)
      duplicatePhase: (boardId, fromPhase, toPhase, targetBoardId) => {
        const s = get()
        const src = s.boardPhases?.[boardId]?.[fromPhase] || {}
        const destBoardId = targetBoardId || boardId
        const copy = {
          playerSlots:   (src.playerSlots   || []).map((sl) => ({ ...sl, id: uuid() })),
          telestration:  (src.telestration  || []).map((t)  => ({ ...t,  id: uuid() })),
          opponentSlots: (src.opponentSlots || []).map((o)  => ({ ...o,  id: uuid() })),
        }
        set((st) => ({
          boardPhases: {
            ...st.boardPhases,
            [destBoardId]: {
              ...(st.boardPhases[destBoardId] || {}),
              [toPhase]: copy,
            },
          },
        }))
      },

      // ── Telestration (unified with full-phase undo) ───────────────────────
      addTelestrationItem: (boardId, phase, item) => {
        const s = get()
        const cur = s.boardPhases?.[boardId]?.[phase]?.telestration || []
        set((st) => withUndo(st, boardId, phase, { telestration: [...cur, item] }))
      },

      removeTelestrationItem: (boardId, phase, itemId) => {
        const s = get()
        const cur = s.boardPhases?.[boardId]?.[phase]?.telestration || []
        set((st) => withUndo(st, boardId, phase, { telestration: cur.filter((i) => i.id !== itemId) }))
      },

      setTelestration: (boardId, phase, telestration) =>
        set((s) => ({
          boardPhases: {
            ...s.boardPhases,
            [boardId]: {
              ...(s.boardPhases[boardId] || {}),
              [phase]: { ...(s.boardPhases[boardId]?.[phase] || {}), telestration },
            },
          },
        })),

      clearTelestration: (boardId, phase) => {
        const s = get()
        const cur = s.boardPhases?.[boardId]?.[phase]?.telestration || []
        if (!cur.length) return
        set((st) => withUndo(st, boardId, phase, { telestration: [] }))
      },

      // ── Undo / Redo (full phase state) ────────────────────────────────────
      undoTelestration: (boardId, phase) => {
        const s = get()
        const key = `${boardId}_${phase}`
        const stack = s.undoStacks[key] || []
        if (!stack.length) return false
        const prev = stack[stack.length - 1]
        const current = snapshotPhase(s, boardId, phase)
        set((st) => ({
          undoStacks: { ...st.undoStacks, [key]: stack.slice(0, -1) },
          redoStacks: { ...st.redoStacks, [key]: [...(st.redoStacks[key] || []), current].slice(-50) },
          boardPhases: {
            ...st.boardPhases,
            [boardId]: {
              ...(st.boardPhases[boardId] || {}),
              [phase]: { ...(st.boardPhases[boardId]?.[phase] || {}), ...prev },
            },
          },
        }))
        return true
      },

      redoTelestration: (boardId, phase) => {
        const s = get()
        const key = `${boardId}_${phase}`
        const stack = s.redoStacks[key] || []
        if (!stack.length) return false
        const next = stack[stack.length - 1]
        const current = snapshotPhase(s, boardId, phase)
        set((st) => ({
          redoStacks: { ...st.redoStacks, [key]: stack.slice(0, -1) },
          undoStacks: { ...st.undoStacks, [key]: [...(st.undoStacks[key] || []), current].slice(-50) },
          boardPhases: {
            ...st.boardPhases,
            [boardId]: {
              ...(st.boardPhases[boardId] || {}),
              [phase]: { ...(st.boardPhases[boardId]?.[phase] || {}), ...next },
            },
          },
        }))
        return true
      },

      // ── Phase Notes ──────────────────────────────────────────────────────
      setPhaseNote: (boardId, phase, note) =>
        set((s) => ({
          phaseNotes: {
            ...s.phaseNotes,
            [boardId]: {
              ...(s.phaseNotes[boardId] || {}),
              [phase]: note,
            },
          },
        })),

      getPhaseNote: (boardId, phase) => {
        const s = get()
        return s.phaseNotes?.[boardId]?.[phase] || ''
      },

      // ── Custom Formations ─────────────────────────────────────────────────
      saveCustomFormation: (format, name, positions) =>
        set((s) => ({
          customFormations: {
            ...s.customFormations,
            [format]: {
              ...(s.customFormations[format] || {}),
              [name]: positions,
            },
          },
        })),

      deleteCustomFormation: (format, name) =>
        set((s) => {
          const fmt = { ...(s.customFormations[format] || {}) }
          delete fmt[name]
          return { customFormations: { ...s.customFormations, [format]: fmt } }
        }),

      // ── UI setters ────────────────────────────────────────────────────────
      setCurrentTeamId:  (id)    => set({ currentTeamId: id }),
      setCurrentBoardId: (id)    => set({ currentBoardId: id }),
      setCurrentPhase:   (phase) => set({ currentPhase: phase }),
      setActiveTool:     (tool)  => set({ activeTool: tool }),
      setPlacingPlayerId:(id)    => set({ placingPlayerId: id }),
      setToolOptions: (opts) => set((s) => ({ toolOptions: { ...s.toolOptions, ...opts } })),
      setViewOptions: (opts) => set((s) => ({ viewOptions: { ...s.viewOptions, ...opts } })),
      setFieldTheme:  (theme) => set({ fieldTheme: theme }),

      // ── Toast ─────────────────────────────────────────────────────────────
      showToast: (message) => {
        set({ toast: { message, id: Date.now() } })
      },
      clearToast: () => set({ toast: null }),

      // ── Undo stack depth for UI feedback ─────────────────────────────────
      canUndo: (boardId, phase) => {
        const s = get()
        return (s.undoStacks[`${boardId}_${phase}`] || []).length > 0
      },
      canRedo: (boardId, phase) => {
        const s = get()
        return (s.redoStacks[`${boardId}_${phase}`] || []).length > 0
      },
    }),
    {
      name: 'tactix-v1',
      partialize: (s) => ({
        teams:            s.teams,
        players:          s.players,
        boards:           s.boards,
        boardPhases:      s.boardPhases,
        viewOptions:      s.viewOptions,
        fieldTheme:       s.fieldTheme,
        customFormations: s.customFormations,
        phaseNotes:       s.phaseNotes,
      }),
    }
  )
)

export default useStore
