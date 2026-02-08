import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { JournalProvider } from './context/JournalContext'
import { GoogleDriveProvider } from './context/GoogleDriveContext'
import { ToastProvider } from './context/ToastContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <JournalProvider>
      <GoogleDriveProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </GoogleDriveProvider>
    </JournalProvider>
  </StrictMode>,
)
