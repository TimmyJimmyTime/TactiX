# TactiX — Handoff Document
> Last updated: 2026-06-12 — CoachHub v1.0 design system, SuiteNav, ErrorBoundary, react-konva fix.

---

## Running the App

```bash
cd "C:\Claude Code\TactiX"
npm run dev          # http://localhost:5175 (port locked in vite.config.js)
npm run build        # must produce zero errors
```

Double-click `Run TactiX.bat` in the project folder to start the server and open the browser automatically.

All data persists to `localStorage` key `tactix-v1`. No backend. No `.env` needed.

---

## Stack

React 19 · Vite 8 · **react-konva 19.0.10** (see pinned version note) · Zustand 5 (persist) · React Router v7 · Tailwind v3 · jsPDF · uuid v14

---

## Directory Structure

```
src/
  App.jsx                              # Routes + global <Toast />
  index.css                            # Inter font, antialiasing, custom scrollbars/select arrow
  store/
    index.js                           # Zustand store
  utils/
    formations.js                      # Built-in + custom formation templates
    fieldGeometry.js                   # Normalized-coordinate helpers
    exportUtils.js                     # PNG/PDF export (jsPDF + Konva.toDataURL)
  components/
    field/
      FieldCanvas.jsx                  # forwardRef, drag-drop, slot popover, laser
      FieldMarkings.jsx                # Visual-only field lines + mowed stripes + grid
      PlayerLayer.jsx                  # Player tokens + Opponent tokens
      TelestrationLayer.jsx            # Saved & in-progress annotations
    panels/
      LeftPanel.jsx                    # Phase tabs, tools, formation builder trigger
      RightPanel.jsx                   # Roster (drag-from-sidebar) + Opponents tab
    modals/
      ConfirmModal.jsx                 # Reusable confirmation dialog
      FormationBuilderModal.jsx        # Custom formation builder with Konva stage
    ui/
      Toast.jsx                        # "Saved ✓" toast (auto-dismiss 2.4s)
    SuiteNav.jsx                       # CoachHub 48px top nav + app switcher dropdown
  ErrorBoundary.jsx                    # Root error boundary — shows readable crash screen
  pages/
    Dashboard.jsx                      # Teams, recent boards, duplicate board
    BoardEditor.jsx                    # Main editor, export, presentation mode
    TeamManager.jsx                    # Roster CRUD
.claude/
  launch.json                          # Preview server config (port 5175)
vite.config.js                         # server.port = 5175, strictPort = true
Run TactiX.bat                         # Double-click to start server + open browser
```

---

## State Shape (Zustand)

```js
// Persisted to localStorage "tactix-v1"
{
  teams:            [{ id, name, format, color, createdAt }],
  players:          { [teamId]: [{ id, number, name, positions[], isActive }] },
  boards:           [{ id, teamId, name, format, formation, createdAt, updatedAt }],
  boardPhases: {
    [boardId]: {
      [phase]: {                          // 'attack'|'defense'|'off_trans'|'def_trans'
        playerSlots:   [{ id, playerId, label, x, y }],    // x/y = 0–1 normalized
        telestration:  [{ id, type, points[], color, weight, arrowStyle, opacity, text?, fontSize? }],
        opponentSlots: [{ id, number, x, y }],
      }
    }
  },
  viewOptions:      { showNames, showNumbers, showPositions, showGrid },
  fieldTheme:       'classic' | 'dark' | 'whiteboard',
  customFormations: { [format]: { [name]: [{label, x, y}] } },
  phaseNotes:       { [boardId]: { [phase]: string } },
}

// Session-only (not persisted)
{
  currentTeamId, currentBoardId, currentPhase,
  activeTool,        // 'select'|'arrow'|'straight_arrow'|'freehand'|'zone'|'text'|'eraser'|'laser'
  placingPlayerId,
  toolOptions:  { color, weight, arrowStyle, opacity, fontSize },
  undoStacks:   { ["${boardId}_${phase}"]: [...fullPhaseSnapshots] },
  redoStacks:   { ["${boardId}_${phase}"]: [...fullPhaseSnapshots] },
  toast:        null | { message, id },
}
```

---

## Key Architecture

### Coordinate System
- All positions stored as normalized fractions (x: 0–1, y: 0–1)
- y=0 = opponent's goal (top), y=1 = our goal (bottom)
- Field is portrait (taller than wide) — `getFieldRect()` maintains aspect ratio

### ⚠️ Phase State Subscription (CRITICAL — do not regress)
`FieldCanvas` and `PlayerLayer` subscribe directly to the live phase data:
```js
const phaseData = useStore((s) => s.boardPhases?.[boardId]?.[phaseKey])
const slots     = phaseData?.playerSlots   || []
const opponents = phaseData?.opponentSlots || []
```
**Never** replace this with `useStore((s) => s.getPhaseState)` — that returns a stable function reference
that never triggers re-renders. Without the direct subscription, every drag callback closes over stale
`slots` and overwrites previous drags, making player positions appear to reset when switching phases.

### Undo/Redo
- Snapshots the **entire phase state** `{ playerSlots, telestration, opponentSlots }`
- Every phase-mutating action pushes to undo stack
- Helper: `withUndo(state, boardId, phase, nextPartialPhaseData)` in store
- Actions: `undoTelestration(boardId, phase)` / `redoTelestration(boardId, phase)` (names kept for compat)
- Max 50 entries per board+phase stack

### Eraser (do not regress)
- Shapes named `name="tele-{id}"` in Konva
- `stage.getIntersection(pos)` for hit testing — no per-shape onClick
- `eraserActive = useRef(false)` tracks mouse-held state
- Every shape has `hitStrokeWidth={Math.max(20, lw * 5)}`

### Run Arrow (do not regress)
- Records all mouse positions → simplifies to 7 control points → `tension=0.5`

### Player Token Drag (do not regress)
- `onDragEnd` uses `e.target.x()` / `e.target.y()` — NOT `stage.getPointerPosition()`

### forwardRef on FieldCanvas
- Exposes `getStage()` via `useImperativeHandle`
- Used by `BoardEditor` for PNG/PDF export

### Drag from Sidebar → Field
- Player rows in RightPanel: `draggable`, `dataTransfer.setData('application/tactix-player', player.id)`
- Drop calculates field position via `screenToField(x, y, fieldRect)`
- Snaps to nearest empty slot if within 0.12 normalized distance; else places freely

### Slot Popover
- Clicking an empty slot with `activeTool === 'select'` opens a `fixed` HTML popover
- Lists available (unplaced) players; clicking one places them in the slot

### Opponent Tokens
- Visual: rotated 45° dark square with red border (diamond shape)
- Added from Right Panel "Opponents" tab
- Draggable; right-click to remove

### Custom Formations
- Stored in `customFormations[format][name]` (persisted)
- Built in `FormationBuilderModal`
- Appear in formation dropdown with `★` suffix

### Phase Notes
- Stored as `phaseNotes[boardId][phase]` (string, persisted)
- Collapsible section at bottom of LeftPanel; dot indicator when notes exist
- Shown in presentation mode as a semi-transparent overlay

### Playbook PDF Export (All Phases)
- Async: iterates phases, calls `setCurrentPhase`, waits 350ms, captures `stage.toDataURL`
- Overlay modal shows progress; original phase restored after export

### Auto Play-through (Presentation Mode)
- "▶ Auto" button toggles auto-advance with `setInterval`
- `autoPlayRef` (mutable ref) prevents stale closure in interval callback
- Speed: 2s / 4s / 6s / 10s per phase

### Grid Overlay
- `viewOptions.showGrid` → passed via `FieldCanvas` → `FieldMarkings` renders dashed grid lines

### Keyboard Shortcuts
- `S` Select · `A` Arrow · `F` Freehand · `Z` Zone · `T` Text · `E` Eraser · `P` Pass arrow
- `Ctrl+Z` Undo · `Ctrl+Y` Redo · `Esc` Cancel/exit

### Export
- `exportPNG` / `exportPDF` — `stage.toDataURL({ pixelRatio: 2 })` → download
- `exportFullPDF(results, boardName)` in `exportUtils.js` — multi-page jsPDF playbook
- Print — `window.print()`

### Responsive / Mobile
- Panels: `hidden lg:block` by default; toggle with `☰` / `👥` header buttons

---

## Design System

**CoachHub v1.0** — dark pine surfaces, warm bone ink, per-app accents.

### Core Tokens (index.css + tailwind.config.js)
```
Background (body):  #0A100E   --ch-bg-0
Panel surface:      #18241F   --ch-bg-1   (Tailwind: bg-panel)
Panel light:        #213029   --ch-bg-2   (Tailwind: bg-panel-light)
Border:             rgba(220,230,220,0.08) (Tailwind: border-border)
Primary ink:        #F2EFE5   --ch-ink-0
Muted ink:          #8A958D   --ch-ink-2
Brand green:        #88C66F   --ch-brand  (Tailwind: lime)
Danger:             #E66B5D   --ch-danger
TactiX accent:      #88C66F   (same as brand)
```

### Tailwind Aliases (tailwind.config.js)
```js
lime:    { DEFAULT: '#88C66F', dark: '#6EAB58' }
panel:   { DEFAULT: '#18241F', light: '#213029' }
surface: '#0A100E'
border:  'rgba(220,230,220,0.08)'
```

### Typography
- **Display/headings**: Archivo (Google Fonts)
- **UI/body**: DM Sans (Google Fonts)
- **Data/numbers**: JetBrains Mono (Google Fonts)
- Konva text: `fontFamily="Inter, system-ui, sans-serif"` (canvas)
- Section eyebrow labels: JetBrains Mono, `color: '#8A958D'`

### SuiteNav
48px pine bar (`#111B17`). Left: CoachHub brand mark + app pill. Right: grid app-switcher, bell, avatar.
All 4 apps in the switcher: TactiX (`#88C66F`), Session Architect (`#6FB8B0`), Tactivize (`#6FA8D9`), CoachLog (`#D9C46F`).

### Suite Apps
- TactiX: https://tacticx.netlify.app
- CoachLog: https://coachlog.netlify.app
- Tactivize: https://tactivize.netlify.app

### Deployment
`netlify.toml` configured: `npm run build`, publish `dist`, SPA redirect `/* → /index.html` (status 200).
GitHub: https://github.com/TimmyJimmyTime/TactiX

### Field Themes
- `classic`: `#1e5c1e` (rich green)
- `dark`: `#0c2010` (near-black green)
- `whiteboard`: off-white

### Player Tokens
- Outfield: circle, `fill=teamColor`, white stroke 2.5px, `shadowBlur=14`
- GK: rounded square (distinctive shape), lighter shade of team color
- Opponent: diamond (45° rotated rect), `fill='#1c0808'`, red stroke
- Jersey number: Inter 700, luminance-based text contrast (black or white)

### Animations
- `animate-fade-in`: 0.18s ease (tool option panels, phase notes)
- `animate-toast-in`: spring bounce (toast notification)

---

## ⚠️ react-konva Version — DO NOT UPGRADE

`react-konva` is pinned to **19.0.10** in `package.json`. Do not upgrade to 19.2.x.

Versions 19.2.x introduced `flushSyncFromReconciler` / `flushSyncWork` inside a no-dependency `useLayoutEffect` in `StageWrap`. This causes a global flush of ALL React work (both Konva and DOM reconcilers) on every render. With Zustand v5's `useSyncExternalStore`, this created an infinite loop: Konva's `useLayoutEffect` → flush DOM work → Zustand re-renders FieldCanvas → Konva `useLayoutEffect` runs again → ... → React error #185 (Maximum update depth exceeded).

Version 19.0.10 uses only `updateContainer` with no global flush. The two reconcilers run independently and this loop cannot occur. If you need to upgrade react-konva, verify that the `flushSync*` issue is resolved upstream before bumping.

---

## Bugs Fixed (Do Not Regress)

| Bug | Fix |
|-----|-----|
| Curved arrow one direction only | Freehand trace + 7-pt simplification + tension=0.5 |
| Eraser not working | `stage.getIntersection` + `eraserActive` ref |
| Players shift on reload | `e.target.x()/y()` in drag end |
| CSS @import after @tailwind | @import on line 1 of index.css |
| Double-click on field-bg | onClick only on Stage, not Rect |
| **Phase positions lost on switch** | **FieldCanvas/PlayerLayer now subscribe directly to `boardPhases[boardId][phaseKey]` — stale closure in drag callbacks eliminated** |
| Dev server port mismatch | `vite.config.js` locks port to 5175 with `strictPort: true` |
| **Netlify 404 on direct board URL** | **Added `[[redirects]] /* → /index.html` to `netlify.toml` — SPA needs all routes served from index.html** |
| **Blank/black page on render crash** | **Added `ErrorBoundary.jsx` wrapping App — crashes now show readable error + back button instead of silent black screen** |
| **React error #185 (infinite loop)** | **Downgraded react-konva to 19.0.10 — 19.2.x `flushSyncWork` in no-deps `useLayoutEffect` + Zustand v5 `useSyncExternalStore` = infinite render loop** |

---

## Store Actions

| Action | Description |
|--------|-------------|
| `setPhasePlayerSlots(boardId, phase, slots)` | Set all player slots (with undo) |
| `setPhaseOpponentSlots(boardId, phase, opponentSlots)` | Set all opponent slots (with undo) |
| `addOpponent(boardId, phase, opponent)` | Add one opponent slot (with undo) |
| `removeOpponent(boardId, phase, id)` | Remove one opponent (with undo) |
| `duplicatePhase(boardId, fromPhase, toPhase)` | Copy a phase's full state to another |
| `duplicateBoard(boardId, newName)` | Clone entire board (all 4 phases) |
| `saveCustomFormation(format, name, positions)` | Save/overwrite a custom formation |
| `deleteCustomFormation(format, name)` | Delete a custom formation |
| `setPhaseNote(boardId, phase, note)` | Save coach notes string for a phase |
| `getPhaseNote(boardId, phase)` | Read coach notes string for a phase |
| `showToast(message)` | Show brief toast (auto-clears 2.4s) |

---

## What's NOT Built Yet

- Backend (Node.js / Express / PostgreSQL / Prisma)
- Authentication
- Share links / read-only public view
- Player photos / avatar upload
- CSV roster import
- Opponent formation overlay (named formations for opponent)
- Drag reorder of phases

---

## To Resume Development

```
cd "C:\Claude Code\TactiX"
npm run dev
```
Open http://localhost:5175. Give this file to the next Claude instance and say:
*"Read HANDOFF.md in C:\Claude Code\TactiX and continue development."*
