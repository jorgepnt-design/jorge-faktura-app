import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useStore } from './store/useStore'

// Nur im Dev-Server: Store für manuelle Tests in der Konsole zugänglich machen
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__store = useStore
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
