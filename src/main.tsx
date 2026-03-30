import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './lib/i18n'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.warn(
    '[Clerk] VITE_CLERK_PUBLISHABLE_KEY が設定されていません。' +
    '.env ファイルに設定してください。',
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY ?? ''}>
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
