import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { PreferencesProvider } from './context/PreferencesContext.jsx'
import { NotificationsProvider } from './context/NotificationsContext.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <NotificationsProvider>
          <PreferencesProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </PreferencesProvider>
        </NotificationsProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
