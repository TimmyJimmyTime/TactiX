import { useState } from 'react';

// ── CoachHub Suite Navigation ─────────────────────────────────────────────
// Design system: dark pine surfaces, Archivo display + DM Sans UI
// Per-app accents: tacticx #88C66F | session #6FB8B0 | tactivize #6FA8D9 | coachlog #D9C46F

const CH_APPS = [
  { id: 'tacticx',   name: 'TacticX',          tag: 'Tactics board',     accent: '#88C66F', href: '#' },
  { id: 'session',   name: 'Session Architect', tag: 'Training sessions', accent: '#6FB8B0', href: '#' },
  { id: 'tactivize', name: 'Tactivize',         tag: 'Video analysis',    accent: '#6FA8D9', href: 'https://tactivize.netlify.app' },
  { id: 'coachlog',  name: 'CoachLog',          tag: 'Team & game log',   accent: '#D9C46F', href: 'https://coachlog.netlify.app' },
];

// CoachHub brand mark SVG
function BrandMark({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="CoachHub">
      <rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="#88C66F" fillOpacity="0.14"/>
      <rect x="1.5" y="1.5" width="21" height="21" rx="5" stroke="#88C66F" strokeWidth="1.3"/>
      <path d="M12 6v12M6 12h12" stroke="#88C66F" strokeWidth="1.1" strokeLinecap="round" opacity="0.4"/>
      <circle cx="12" cy="12" r="3.2" stroke="#88C66F" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="1.1" fill="#88C66F"/>
    </svg>
  );
}

// Per-app icon marks
function AppMark({ app, size = 18 }) {
  const p = {
    width: size, height: size, viewBox: '0 0 18 18',
    fill: 'none', stroke: 'currentColor', strokeWidth: '1.4',
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  if (app === 'tacticx') return (
    <svg {...p} aria-label="TacticX">
      <rect x="2" y="3.5" width="14" height="11" rx="1"/>
      <path d="M9 3.5v11M5 9h2M11 9h2"/>
      <path d="m5.5 6.5 3 3M8.5 6.5l-3 3" strokeWidth="1.6"/>
    </svg>
  );
  if (app === 'session') return (
    <svg {...p} aria-label="Session Architect">
      <rect x="2" y="6" width="4" height="6" rx="0.8"/>
      <rect x="7" y="4" width="4" height="10" rx="0.8"/>
      <rect x="12" y="7.5" width="4" height="3" rx="0.8"/>
    </svg>
  );
  if (app === 'tactivize') return (
    <svg {...p} aria-label="Tactivize">
      <path d="M4 3.5v11l9-5.5z"/>
      <circle cx="14.5" cy="3.5" r="1.6" fill="currentColor"/>
    </svg>
  );
  if (app === 'coachlog') return (
    <svg {...p} aria-label="CoachLog">
      <path d="M3.5 2.5h9l3 3v10h-12z"/>
      <path d="M12.5 2.5v3h3M6 9h6M6 12h4"/>
    </svg>
  );
  return null;
}

// Grid icon (app switcher trigger)
function GridIcon() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="2.5" width="5" height="5" rx="0.5"/>
      <rect x="10.5" y="2.5" width="5" height="5" rx="0.5"/>
      <rect x="2.5" y="10.5" width="5" height="5" rx="0.5"/>
      <rect x="10.5" y="10.5" width="5" height="5" rx="0.5"/>
    </svg>
  );
}

// Bell icon
function BellIcon() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14h10c-1.5-1-2-2-2-4.5V8a3 3 0 0 0-6 0v1.5C6 12 5.5 13 4 14zM7.5 14a1.5 1.5 0 0 0 3 0"/>
    </svg>
  );
}

const S = {
  nav: {
    height: 48,
    minHeight: 48,
    background: '#111B17',
    borderBottom: '1px solid rgba(220,230,220,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    flexShrink: 0,
    zIndex: 100,
    gap: 16,
    fontFamily: '"DM Sans", system-ui, -apple-system, sans-serif',
  },
  left: {
    display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0,
  },
  hubBack: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 10px 6px 6px',
    borderRadius: 10,
    textDecoration: 'none',
    color: '#F2EFE5',
    fontFamily: '"Archivo", system-ui, sans-serif',
    fontWeight: 700,
    fontSize: 13.5,
    letterSpacing: '-0.005em',
  },
  sep: { color: '#5E6A63', fontWeight: 400, margin: '0 -2px 0 4px' },
  right: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  iconBtn: {
    width: 32, height: 32,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', border: 0,
    borderRadius: 6,
    color: '#C8CFC4',
    cursor: 'pointer',
  },
};

export default function SuiteNav({ currentApp = 'tacticx', breadcrumbs }) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const current = CH_APPS.find(a => a.id === currentApp) || CH_APPS[0];

  return (
    <nav style={S.nav}>
      {/* ── Left: brand + app tag + optional breadcrumbs ── */}
      <div style={S.left}>
        <a href="#" style={S.hubBack} title="CoachHub home">
          <BrandMark size={20} />
          <span>CoachHub</span>
          <span style={S.sep}>/</span>
        </a>

        {/* App tag */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px',
          background: '#213029',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          flexShrink: 0,
        }}>
          <span style={{ display: 'inline-flex', color: current.accent }}>
            <AppMark app={current.id} size={14} />
          </span>
          <span style={{ color: '#F2EFE5' }}>{current.name}</span>
        </div>

        {/* Optional breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginLeft: 4, fontSize: 12.5,
            overflow: 'hidden', flexShrink: 1, minWidth: 0,
          }}>
            {breadcrumbs.map((b, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#5E6A63' }}>/</span>
                <span style={{
                  color: i === breadcrumbs.length - 1 ? '#F2EFE5' : '#8A958D',
                  fontWeight: i === breadcrumbs.length - 1 ? 500 : 400,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{b}</span>
              </span>
            ))}
          </nav>
        )}
      </div>

      {/* ── Right: app switcher + bell + avatar ── */}
      <div style={S.right}>
        {/* App switcher */}
        <div style={{ position: 'relative' }}>
          <button
            style={S.iconBtn}
            onClick={() => setSwitcherOpen(o => !o)}
            title="Switch app"
          >
            <GridIcon />
          </button>

          {switcherOpen && (
            <div
              onMouseLeave={() => setSwitcherOpen(false)}
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: '#18241F',
                border: '1px solid rgba(220,230,220,0.16)',
                borderRadius: 14,
                padding: 10,
                width: 280,
                boxShadow: '0 18px 48px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
                zIndex: 200,
              }}
            >
              <div style={{
                fontSize: 10.5, fontWeight: 600,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                color: '#8A958D', padding: '4px 6px 8px',
              }}>
                CoachHub apps
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {CH_APPS.map(a => (
                  <a
                    key={a.id}
                    href={a.href}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '24px 1fr',
                      gridTemplateRows: 'auto auto',
                      gap: '0 8px',
                      padding: 10,
                      borderRadius: 10,
                      textDecoration: 'none',
                      color: '#F2EFE5',
                      background: a.id === currentApp ? 'rgba(136,198,111,0.14)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (a.id !== currentApp) e.currentTarget.style.background = '#213029'; }}
                    onMouseLeave={e => { if (a.id !== currentApp) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ gridRow: '1 / span 2', alignSelf: 'center', display: 'inline-flex', color: a.accent }}>
                      <AppMark app={a.id} size={20} />
                    </span>
                    <span style={{
                      fontFamily: '"Archivo", system-ui, sans-serif',
                      fontWeight: 700, fontSize: 13, letterSpacing: '-0.01em',
                    }}>{a.name}</span>
                    <span style={{ fontSize: 10.5, color: '#8A958D' }}>{a.tag}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bell */}
        <button style={{ ...S.iconBtn, position: 'relative' }} title="Notifications">
          <BellIcon />
          <span style={{
            position: 'absolute', top: 8, right: 9,
            width: 6, height: 6,
            background: '#88C66F', borderRadius: '50%',
            boxShadow: '0 0 0 2px #111B17',
          }} />
        </button>

        {/* Avatar */}
        <span style={{
          width: 28, height: 28,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%',
          background: '#E66B5D',
          color: '#0a1208',
          fontFamily: '"Archivo", system-ui, sans-serif',
          fontWeight: 700, fontSize: 11,
          letterSpacing: '0.01em',
          flexShrink: 0,
          userSelect: 'none',
        }} title="Coach">
          C
        </span>
      </div>
    </nav>
  );
}
