import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { JournalProvider } from './context/JournalContext'
import { GoogleDriveProvider } from './context/GoogleDriveContext'
import { ToastProvider } from './context/ToastContext'
import { ClassProvider } from './context/ClassContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClassProvider>
      <JournalProvider>
        <ToastProvider>
          <GoogleDriveProvider>
            <App />
          </GoogleDriveProvider>
        </ToastProvider>
      </JournalProvider>
    </ClassProvider>
  </StrictMode>,
)
