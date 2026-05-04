import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard   from './pages/Dashboard'
import BoardEditor from './pages/BoardEditor'
import TeamManager from './pages/TeamManager'
import Toast       from './components/ui/Toast'
import SuiteNav    from './components/SuiteNav'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <SuiteNav currentApp="TactiX" />
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/"               element={<Dashboard />} />
            <Route path="/board/:boardId" element={<BoardEditor />} />
            <Route path="/teams/:teamId"  element={<TeamManager />} />
            <Route path="*"               element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        {/* Global toast — renders on top of everything */}
        <Toast />
      </div>
    </BrowserRouter>
  )
}
