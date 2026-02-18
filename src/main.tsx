import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { JournalProvider } from './context/JournalContext'
import { SupabaseProvider } from './context/SupabaseContext'
import { ToastProvider } from './context/ToastContext'
import { ClassProvider } from './context/ClassContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClassProvider>
      <JournalProvider>
        <ToastProvider>
          <SupabaseProvider>
            <App />
          </SupabaseProvider>
        </ToastProvider>
      </JournalProvider>
    </ClassProvider>
  </StrictMode>,
)
