import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import { I18nProvider } from './context/I18nContext'
import { PlayerProvider } from './context/player-context'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
        <I18nProvider>
          <AuthProvider>
            <PlayerProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </PlayerProvider>
          </AuthProvider>
        </I18nProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>
)
