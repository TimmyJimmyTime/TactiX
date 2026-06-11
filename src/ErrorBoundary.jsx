import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: '#0A100E', color: '#F2EFE5',
          fontFamily: 'DM Sans, system-ui, sans-serif', padding: 32, gap: 16,
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#E66B5D' }}>Something went wrong</div>
          <pre style={{
            background: '#18241F', border: '1px solid rgba(220,230,220,0.08)',
            borderRadius: 8, padding: 16, fontSize: 12, color: '#8A958D',
            maxWidth: 640, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowY: 'auto', maxHeight: 300,
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: '#88C66F', color: '#0A100E', fontWeight: 700,
              border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14,
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
