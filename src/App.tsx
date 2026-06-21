import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout }      from './components/layout/AppLayout'
import { ScenarioPage }   from './pages/ScenarioPage'
import { EnvironmentPage} from './pages/EnvironmentPage'
import { HistoryPage }    from './pages/HistoryPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/scenarios" replace />} />
          <Route path="scenarios"   element={<ScenarioPage />} />
          <Route path="environments" element={<EnvironmentPage />} />
          <Route path="history"     element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}