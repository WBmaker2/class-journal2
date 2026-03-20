import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { JournalProvider } from './context/JournalContext'
import { AuthProvider } from './context/AuthContext'
import { SecurityProvider } from './context/SecurityContext'
import { SyncProvider } from './context/SyncContext'
import { ToastProvider } from './context/ToastContext'
import { ClassProvider } from './context/ClassContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <SecurityProvider>
          <SyncProvider>
            <ClassProvider>
              <JournalProvider>
                <App />
              </JournalProvider>
            </ClassProvider>
          </SyncProvider>
        </SecurityProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
