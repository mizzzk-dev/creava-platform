import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ThemeProvider } from '@/lib/theme'
import { AppAuthProvider } from '@/lib/auth/AuthProvider'
import { HAS_LOGTO } from '@/lib/auth/config'
import App from './App'
import { CartProvider } from '@/modules/cart/context'
import './lib/i18n'
import './index.css'

if (!HAS_LOGTO && import.meta.env.DEV) {
  console.warn(
    '[Logto] VITE_LOGTO_ENDPOINT / VITE_LOGTO_APP_ID が設定されていません。' +
    'frontend/.env.local に Logto 設定を追加してください。' +
    '認証機能は無効化された状態で起動します。',
  )
}

const inner = (
  <ThemeProvider>
    <CartProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    </CartProvider>
  </ThemeProvider>
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <AppAuthProvider>{inner}</AppAuthProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
