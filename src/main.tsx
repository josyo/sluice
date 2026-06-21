import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/components/ui/button.js'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
