import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import SanityStudio from './SanityStudio.tsx'
import App from './App.tsx'
import './index.css'

const path = window.location.pathname;

if (path.startsWith('/studio')) {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <SanityStudio />
    </StrictMode>,
  )
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
