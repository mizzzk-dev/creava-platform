# 計測基盤 / ダッシュボード / A/Bテスト運用基盤（main / store / fc）

- 更新日: 2026-04-18
- 対象: `mizzz.jp` / `store.mizzz.jp` / `fc.mizzz.jp`
- 目的: 導線改善を継続的に回すための KPI・イベント・集計運用の土台を統一する

## 1. 現状調査サマリー（実装ベース）

### 1-1. 既存の計測状況
- GA4 連携は既存実装あり（`VITE_GA_MEASUREMENT_ID` + `trackEvent` / `trackPageView`）。
- クリック計測は `cta_click` 系を中心に点在。
- Cookie 同意導線はあるが、fanclub で同意連動が弱く一部強制有効化される経路があった。
- フォームは `inquiry-submission` に保存され、ops 向け `summary/list/export` API は既存。
- SEO は `PageHead` / structured data 既存。

### 1-2. 不足していた点
1. main/store/fc でイベント属性が統一されず、比較が難しい。
2. server 側に行動イベントの保存先がなく、導線別の離脱把握が困難。
3. 実験（A/B）ID・variant をイベントへ紐づける土台が未整備。
4. consent と計測の連動がレイアウトごとに不統一。

## 2. KPI 設計（サイト別）

### main
- main → store 遷移率
- main → fc 遷移率
- About / Events / Contact 遷移率
- Contact 開始率 / 完了率

### store
- 一覧 → 詳細遷移率
- お気に入り追加率
- cart クリック率
- filter / sort 利用率
- support 導線（faq/guide/contact）利用率

### fc
- join / login CTA クリック率
- 登録・ログイン完了率
- 通知センター利用率
- mypage 再訪率
- store 送客率

### 共通（フォーム・サポート）
- form_start / form_confirm / form_submit_success / form_submit_failure
- support_search / faq_open / guide_open

## 3. イベント設計（共通スキーマ）

### 3-1. 必須カテゴリ
`page_view`, `cta_click`, `nav_click`, `hero_click`, `card_click`, `product_view`, `product_favorite_add`, `product_favorite_remove`, `content_view`, `content_favorite_add`, `history_viewed`, `notification_open`, `notification_click`, `search_submit`, `filter_apply`, `sort_apply`, `support_search`, `faq_open`, `guide_open`, `form_start`, `form_confirm`, `form_submit_success`, `form_submit_failure`, `login_click`, `signup_click`, `login_success`, `theme_toggle`, `locale_switch`, `cart_click`, `join_click`, `event_calendar_click`.

### 3-2. 共通属性
- `sourceSite`, `locale`, `theme`, `pageType`, `contentType`
- `entityId`, `entitySlug`, `formType`, `category`
- `userState`, `deviceType`, `referrerType`
- `experimentId`, `variantId`, `timestamp`

## 4. 実装内容（今回）

### 4-1. frontend 計測基盤
- `analytics/context.ts` を追加し、`sourceSite/locale/theme/pageType/userState/deviceType/referrerType/timestamp` を自動付与。
- `trackEvent` / `trackPageView` を強化し、共通属性を常時付与。
- page view 二重送信抑止（同一 pathname 連続送信を抑制）。
- `VITE_ANALYTICS_OPS_ENDPOINT` 指定時、主要イベントを Strapi API へ mirror 送信可能化。
- `analytics/experiments.ts` を追加し、experiment variant の永続割当を提供。
- fanclub/store layout を consent イベント連動へ統一。

### 4-2. backend 計測保存
- 新規 content-type: `analytics-event`。
- 公開取り込み API: `POST /api/analytics-events/public`（PII キーは保存前に除外）。
- ops 集計 API: `GET /api/analytics-events/ops/summary`（`x-analytics-ops-token` 必須）。
- `INQUIRY_OPS_TOKEN` と分離可能な `ANALYTICS_OPS_TOKEN` を追加。
- `ipHash` のみ保存し、生 IP は保持しない。

### 4-3. ダッシュボード / レポート導線
- 最小運用として ops summary API を追加。
- 期間・site 別の件数、event 別件数、formType 別件数、locale 別件数を返却。
- 将来の CSV export / 日次 summary テーブル追加を想定した raw 保存構造。

## 5. consent / privacy / cookie
- 同意前は送信しない（frontend 側 `__MIZZZ_ANALYTICS_ALLOWED__` を遵守）。
- ログイン有無は `guest/logged_in` のみ。ユーザーIDは送らない。
- event payload 取り込み時に `email/phone/name/userId` キーを強制除外。
- 法務導線（cookie policy）との整合を維持。

## 6. A/B テスト運用ルール
- experiment は `experimentId` を固定文字列で定義。
- variant は `getOrAssignVariant(experimentId, ['a','b'])` で初回割当。
- 計測時に `experimentId` を params に渡すと `variantId` が自動付与。
- 無効化は experimentId を送らないだけで可能。

## 7. 環境変数・Secrets・DNS

### frontend
- `VITE_ANALYTICS_OPS_ENDPOINT`（任意）

### backend
- `ANALYTICS_OPS_TOKEN`（推奨、未設定時は `INQUIRY_OPS_TOKEN` にフォールバック）
- `ANALYTICS_IP_HASH_SALT`（推奨、未設定時は `INQUIRY_IP_HASH_SALT` にフォールバック）

### GitHub Secrets / Variables
- 追加候補: `ANALYTICS_OPS_TOKEN`, `ANALYTICS_IP_HASH_SALT`, `VITE_ANALYTICS_OPS_ENDPOINT`

### DNS
- 本対応は既存 API ドメイン内で完結するため **DNS 変更不要**。

## 8. 残課題（次PR候補）
1. `analytics-events/ops/export.csv` 追加。
2. 日次 summary テーブル + retention job（90日 raw / 365日 summary）。
3. Strapi admin トップに KPI カードを追加。
4. support・favorite・history・notification の詳細ファネル可視化。
