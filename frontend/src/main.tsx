import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ThemeProvider } from '@/lib/theme'
import { AppAuthProvider } from '@/lib/auth/AuthProvider'
import { HAS_AUTH } from '@/lib/auth/config'
import App from './App'
import { CartProvider } from '@/modules/cart/context'
import './lib/i18n'
import './index.css'
import { registerServiceWorker } from '@/modules/pwa/lib/registerServiceWorker'
import { applySiteAppMeta } from '@/modules/pwa/lib/appMeta'

if (!HAS_AUTH && import.meta.env.DEV) {
  console.warn(
    '[Auth] 認証設定 が設定されていません。' +
    'frontend/.env.local に Logto 設定を追加してください。' +
    '認証機能は無効化された状態で起動します。',
  )
}


applySiteAppMeta()
registerServiceWorker()

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
