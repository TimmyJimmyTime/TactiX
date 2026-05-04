export default function SuiteNav({ currentApp = 'TactiX' }) {
  const apps = [
    { name: 'TactiX',           href: '#',                               icon: '⚽' }, // TODO: replace with live URL
    { name: 'Tactivize',        href: 'https://tactivize.netlify.app',   icon: '🎬' },
    { name: 'CoachLog',         href: 'https://coachlog.netlify.app',    icon: '📋' },
    { name: 'Session Architect',href: '#',                               icon: '📝' }, // TODO: replace with live URL
  ];

  return (
    <nav
      style={{
        height: 40,
        minHeight: 40,
        background: '#1a1d27',
        borderBottom: '1px solid #2a2d3a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        zIndex: 100,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Left — CoachHub back link */}
      <a
        href="#" // TODO: replace with live CoachHub URL
        style={{ fontSize: 13, color: '#4ade80', textDecoration: 'none', fontWeight: 500 }}
      >
        ← CoachHub
      </a>

      {/* Center — current app name */}
      <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>
        {currentApp}
      </span>

      {/* Right — suite icon links */}
      <div style={{ display: 'flex', gap: 4 }}>
        {apps.map(app => (
          <a
            key={app.name}
            href={app.href}
            title={app.name}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              fontSize: 14,
              textDecoration: 'none',
              background: app.name === currentApp ? 'rgba(74,222,128,0.15)' : 'transparent',
              outline: app.name === currentApp ? '1px solid rgba(74,222,128,0.4)' : 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (app.name !== currentApp) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { if (app.name !== currentApp) e.currentTarget.style.background = 'transparent'; }}
          >
            {app.icon}
          </a>
        ))}
      </div>
    </nav>
  );
}
