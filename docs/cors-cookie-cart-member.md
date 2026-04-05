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

## Cookie 同意
- `mizzz_cookie_consent_v1` に必要最小限の同意状態を保存。
- 同意前は解析を無効化（`window.__MIZZZ_ANALYTICS_ALLOWED__ = false`）。
- Footer の「Cookie設定」から再設定可能。

## Cart 基盤
- `localStorage` 永続化（未ログインでも保持）。
- 機能: 追加 / 数量変更 / 削除 / 小計。
- Stripe 連携は既存の `stripeLink` を利用。将来的に Shopify へ差し替えやすい構成。

## Member 土台
- Clerk 既存基盤を壊さず `useCurrentUser` から会員状態を表示。
- `member` ロールを軸に FC 限定導線を提示。
