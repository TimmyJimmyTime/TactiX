// All positions are normalized (x: 0–1, y: 0–1)
// y=0 = opponent's goal (top), y=1 = our goal (bottom)
// GK is always near y=0.90

export const FORMATIONS = {
  '11v11': {
    '4-3-3': [
      { label: 'GK',  x: 0.50, y: 0.90 },
      { label: 'RB',  x: 0.82, y: 0.72 },
      { label: 'CB',  x: 0.62, y: 0.73 },
      { label: 'CB',  x: 0.38, y: 0.73 },
      { label: 'LB',  x: 0.18, y: 0.72 },
      { label: 'CM',  x: 0.72, y: 0.50 },
      { label: 'CM',  x: 0.50, y: 0.50 },
      { label: 'CM',  x: 0.28, y: 0.50 },
      { label: 'RW',  x: 0.82, y: 0.22 },
      { label: 'ST',  x: 0.50, y: 0.18 },
      { label: 'LW',  x: 0.18, y: 0.22 },
    ],
    '4-2-3-1': [
      { label: 'GK',  x: 0.50, y: 0.90 },
      { label: 'RB',  x: 0.82, y: 0.74 },
      { label: 'CB',  x: 0.62, y: 0.74 },
      { label: 'CB',  x: 0.38, y: 0.74 },
      { label: 'LB',  x: 0.18, y: 0.74 },
      { label: 'CDM', x: 0.62, y: 0.57 },
      { label: 'CDM', x: 0.38, y: 0.57 },
      { label: 'RM',  x: 0.82, y: 0.38 },
      { label: 'CAM', x: 0.50, y: 0.38 },
      { label: 'LM',  x: 0.18, y: 0.38 },
      { label: 'ST',  x: 0.50, y: 0.18 },
    ],
    '4-4-2': [
      { label: 'GK',  x: 0.50, y: 0.90 },
      { label: 'RB',  x: 0.82, y: 0.74 },
      { label: 'CB',  x: 0.62, y: 0.74 },
      { label: 'CB',  x: 0.38, y: 0.74 },
      { label: 'LB',  x: 0.18, y: 0.74 },
      { label: 'RM',  x: 0.82, y: 0.50 },
      { label: 'CM',  x: 0.62, y: 0.50 },
      { label: 'CM',  x: 0.38, y: 0.50 },
      { label: 'LM',  x: 0.18, y: 0.50 },
      { label: 'ST',  x: 0.62, y: 0.22 },
      { label: 'ST',  x: 0.38, y: 0.22 },
    ],
    '4-4-2 Diamond': [
      { label: 'GK',  x: 0.50, y: 0.90 },
      { label: 'RB',  x: 0.82, y: 0.74 },
      { label: 'CB',  x: 0.62, y: 0.74 },
      { label: 'CB',  x: 0.38, y: 0.74 },
      { label: 'LB',  x: 0.18, y: 0.74 },
      { label: 'CDM', x: 0.50, y: 0.60 },
      { label: 'CM',  x: 0.72, y: 0.46 },
      { label: 'CM',  x: 0.28, y: 0.46 },
      { label: 'CAM', x: 0.50, y: 0.33 },
      { label: 'ST',  x: 0.62, y: 0.18 },
      { label: 'ST',  x: 0.38, y: 0.18 },
    ],
    '3-5-2': [
      { label: 'GK',  x: 0.50, y: 0.90 },
      { label: 'CB',  x: 0.68, y: 0.74 },
      { label: 'CB',  x: 0.50, y: 0.74 },
      { label: 'CB',  x: 0.32, y: 0.74 },
      { label: 'RWB', x: 0.90, y: 0.52 },
      { label: 'CM',  x: 0.68, y: 0.50 },
      { label: 'CM',  x: 0.50, y: 0.50 },
      { label: 'CM',  x: 0.32, y: 0.50 },
      { label: 'LWB', x: 0.10, y: 0.52 },
      { label: 'ST',  x: 0.62, y: 0.22 },
      { label: 'ST',  x: 0.38, y: 0.22 },
    ],
    '3-4-3': [
      { label: 'GK',  x: 0.50, y: 0.90 },
      { label: 'CB',  x: 0.68, y: 0.74 },
      { label: 'CB',  x: 0.50, y: 0.74 },
      { label: 'CB',  x: 0.32, y: 0.74 },
      { label: 'RM',  x: 0.82, y: 0.52 },
      { label: 'CM',  x: 0.62, y: 0.50 },
      { label: 'CM',  x: 0.38, y: 0.50 },
      { label: 'LM',  x: 0.18, y: 0.52 },
      { label: 'RW',  x: 0.82, y: 0.22 },
      { label: 'ST',  x: 0.50, y: 0.18 },
      { label: 'LW',  x: 0.18, y: 0.22 },
    ],
    '5-3-2': [
      { label: 'GK',  x: 0.50, y: 0.90 },
      { label: 'RWB', x: 0.90, y: 0.74 },
      { label: 'CB',  x: 0.70, y: 0.74 },
      { label: 'CB',  x: 0.50, y: 0.74 },
      { label: 'CB',  x: 0.30, y: 0.74 },
      { label: 'LWB', x: 0.10, y: 0.74 },
      { label: 'CM',  x: 0.68, y: 0.50 },
      { label: 'CM',  x: 0.50, y: 0.50 },
      { label: 'CM',  x: 0.32, y: 0.50 },
      { label: 'ST',  x: 0.62, y: 0.22 },
      { label: 'ST',  x: 0.38, y: 0.22 },
    ],
    'Custom': [],
  },

  '9v9': {
    '3-2-3': [
      { label: 'GK',  x: 0.50, y: 0.90 },
      { label: 'RB',  x: 0.75, y: 0.72 },
      { label: 'CB',  x: 0.50, y: 0.72 },
      { label: 'LB',  x: 0.25, y: 0.72 },
      { label: 'CM',  x: 0.67, y: 0.50 },
      { label: 'CM',  x: 0.33, y: 0.50 },
      { label: 'RW',  x: 0.82, y: 0.22 },
      { label: 'ST',  x: 0.50, y: 0.18 },
      { label: 'LW',  x: 0.18, y: 0.22 },
    ],
    '3-3-2': [
      { label: 'GK',  x: 0.50, y: 0.90 },
      { label: 'RB',  x: 0.75, y: 0.74 },
      { label: 'CB',  x: 0.50, y: 0.74 },
      { label: 'LB',  x: 0.25, y: 0.74 },
      { label: 'RM',  x: 0.75, y: 0.50 },
      { label: 'CM',  x: 0.50, y: 0.50 },
      { label: 'LM',  x: 0.25, y: 0.50 },
      { label: 'ST',  x: 0.62, y: 0.22 },
      { label: 'ST',  x: 0.38, y: 0.22 },
    ],
    '2-3-3': [
      { label: 'GK',  x: 0.50, y: 0.90 },
      { label: 'CB',  x: 0.65, y: 0.78 },
      { label: 'CB',  x: 0.35, y: 0.78 },
      { label: 'RM',  x: 0.80, y: 0.52 },
      { label: 'CM',  x: 0.50, y: 0.52 },
      { label: 'LM',  x: 0.20, y: 0.52 },
      { label: 'RW',  x: 0.82, y: 0.22 },
      { label: 'ST',  x: 0.50, y: 0.18 },
      { label: 'LW',  x: 0.18, y: 0.22 },
    ],
    '4-2-2': [
      { label: 'GK',  x: 0.50, y: 0.90 },
      { label: 'RB',  x: 0.80, y: 0.74 },
      { label: 'CB',  x: 0.60, y: 0.74 },
      { label: 'CB',  x: 0.40, y: 0.74 },
      { label: 'LB',  x: 0.20, y: 0.74 },
      { label: 'CM',  x: 0.65, y: 0.50 },
      { label: 'CM',  x: 0.35, y: 0.50 },
      { label: 'ST',  x: 0.65, y: 0.22 },
      { label: 'ST',  x: 0.35, y: 0.22 },
    ],
    'Custom': [],
  },

  '7v7': {
    '2-3-1': [
      { label: 'GK',  x: 0.50, y: 0.90 },
      { label: 'CB',  x: 0.65, y: 0.74 },
      { label: 'CB',  x: 0.35, y: 0.74 },
      { label: 'RM',  x: 0.80, y: 0.50 },
      { label: 'CM',  x: 0.50, y: 0.50 },
      { label: 'LM',  x: 0.20, y: 0.50 },
      { label: 'ST',  x: 0.50, y: 0.20 },
    ],
    '3-2-1': [
      { label: 'GK',  x: 0.50, y: 0.90 },
      { label: 'RB',  x: 0.75, y: 0.74 },
      { label: 'CB',  x: 0.50, y: 0.74 },
      { label: 'LB',  x: 0.25, y: 0.74 },
      { label: 'CM',  x: 0.65, y: 0.50 },
      { label: 'CM',  x: 0.35, y: 0.50 },
      { label: 'ST',  x: 0.50, y: 0.20 },
    ],
    '1-3-2': [
      { label: 'GK',  x: 0.50, y: 0.90 },
      { label: 'SW',  x: 0.50, y: 0.80 },
      { label: 'RM',  x: 0.80, y: 0.52 },
      { label: 'CM',  x: 0.50, y: 0.52 },
      { label: 'LM',  x: 0.20, y: 0.52 },
      { label: 'ST',  x: 0.65, y: 0.22 },
      { label: 'ST',  x: 0.35, y: 0.22 },
    ],
    '2-2-2': [
      { label: 'GK',  x: 0.50, y: 0.90 },
      { label: 'CB',  x: 0.65, y: 0.76 },
      { label: 'CB',  x: 0.35, y: 0.76 },
      { label: 'CM',  x: 0.65, y: 0.50 },
      { label: 'CM',  x: 0.35, y: 0.50 },
      { label: 'ST',  x: 0.65, y: 0.24 },
      { label: 'ST',  x: 0.35, y: 0.24 },
    ],
    'Custom': [],
  },
}

// Returns built-in formation names merged with any custom formations, Custom last
export function getFormationNames(format, customFormations = {}) {
  const builtIn = Object.keys(FORMATIONS[format] || {}).filter((n) => n !== 'Custom')
  const custom  = Object.keys(customFormations[format] || {})
  return [...builtIn, ...custom, 'Custom']
}

// Returns slots for a formation (checks custom formations first, then built-ins)
export function getFormationSlots(format, name, customFormations = {}) {
  const positions =
    customFormations[format]?.[name] ??
    FORMATIONS[format]?.[name] ??
    []
  return positions.map((p, i) => ({
    id: `slot-${uuid_simple(i)}`,
    playerId: null,
    label: p.label,
    x: p.x,
    y: p.y,
  }))
}

// Simple deterministic id generator for slot IDs (avoids importing uuid in utils)
function uuid_simple(i) {
  return `builtin-${i}`
}

// Try to keep player assignments when switching formations
export function migrateSlots(oldSlots, newSlots) {
  const usedPlayerIds = new Set()
  return newSlots.map((newSlot) => {
    const match = oldSlots.find(
      (s) => s.playerId && s.label === newSlot.label && !usedPlayerIds.has(s.playerId)
    )
    if (match) {
      usedPlayerIds.add(match.playerId)
      return { ...newSlot, playerId: match.playerId }
    }
    return newSlot
  })
}
