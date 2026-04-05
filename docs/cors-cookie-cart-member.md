# CORS / 初期遅延 / Cookie / Cart / Member 運用メモ

## Strapi CORS
- `backend/config/middlewares.ts` で `https://mizzz.jp` と `https://www.mizzz.jp` を許可。
- Strapi Cloud の `FRONTEND_URL` に追加 origin をカンマ区切りで設定。
- 公開 GET は `Authorization` ヘッダーを付与しない（preflight の削減）。
- Preview/Draft API のみ token 認証を使う。

## 初期アクセス遅延の切り分け
1. ブラウザ DevTools で preflight (`OPTIONS`) と CORS ヘッダーを確認。
2. API 初回応答時間（TTFB）が長い場合は Strapi Cloud の cold start を疑う。
3. クエリ（`fields`, `populate`, `pageSize`, `withCount`）を最小化。
4. フロント側で軽い soft retry + 手動再試行導線を表示。

## Cookie 同意 / Analytics
- 同意状態は `mizzz_cookie_consent_v1`（`frontend/src/modules/cookie/consent.ts`）へ保存。
- 同意前は `window.__MIZZZ_ANALYTICS_ALLOWED__ = false`。
- 同意更新イベント（`mizzz:cookie-consent-updated`）を `MainLayout` で監視し、解析初期化を制御。
- GA4 を使う場合は `frontend/.env` に `VITE_GA_MEASUREMENT_ID=G-XXXXXXX` を設定。
- Footer の「Cookie設定」で同意状態をリセットし、再選択可能。

## Cart 運用
- `localStorage` 永続化（未ログインでも保持）。
- 機能: 追加 / 数量変更 / 削除 / 小計 / 外部決済遷移。
- FC 限定商品の購入可否は会員状態（member/admin）を確認して案内する。
- Stripe 連携は既存の `stripeLink` を利用。将来的に Shopify へ差し替えやすい構成。

## Member 導線
- Clerk 既存基盤を壊さず `useCurrentUser` から会員状態を表示。
- `guest / member / admin` の違いを UI で明示。
- 次アクション（Store / Fanclub / News）を提示して回遊導線を維持。

## 法務ページ編集方針
- `frontend/src/pages/legal/*` は最小限の章立てで運用。
- 最終更新日を明記し、販売条件は商品詳細ページ・外部決済表示を優先する。
- 追加規約が必要な場合も route は維持し、文面のみ差分更新する。
