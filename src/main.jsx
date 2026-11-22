import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/nexora.css'
import './styles/nexora-2.css'
import './styles/tailwind.css'
import { applyAppearance, loadAppearance } from './lib/appearance.js'
import App from './App.jsx'

function readLastUser() {
  try {
    return localStorage.getItem('nexora.lastUser')
  } catch {
    return null
  }
}

applyAppearance(loadAppearance(readLastUser()))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)