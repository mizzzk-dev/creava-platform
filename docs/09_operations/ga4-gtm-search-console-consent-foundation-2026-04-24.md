# GA4 / GTM / Search Console / Consent Mode 計測基盤 runbook（main / store / fc）

- 更新日: 2026-04-24
- 対象: `mizzz.jp`（main） / `store.mizzz.jp`（store） / `fc.mizzz.jp`（fanclub）
- 目的: main / store / fc を横断した意思決定に使える計測基盤を、privacy-aware な運用で定着させる

## 1. 現状確認と問題点（実装調査）

### 1-1. 調査対象
- frontend analytics 実装: `frontend/src/modules/analytics/*`
- cookie consent: `frontend/src/modules/cookie/consent.ts`
- layout ごとの page_view: `frontend/src/components/layout/*Layout.tsx`
- store 計測: `frontend/src/modules/store/*`, `frontend/src/pages/StoreDetailPage.tsx`
- env / docs: `frontend/.env.example`, `frontend/.env.production.example`, `docs/09_operations/analytics-improvement-foundation.md`

### 1-2. 問題点サマリ
1. GA4 は導入済みだが GTM / Search Console 運用方針が runbook 上で分離されていない。
2. consent と計測状態は連動しているが、Consent Mode の明示運用（default/update）を手順化できていない。
3. event taxonomy は拡張済みだが ecommerce / membership / support / error のイベント語彙が docs と実装で揺れやすい。
4. store の EC 計測が CTA 中心で、`view_item_list` / `view_item` / `add_to_cart` / `begin_checkout` の標準イベント利用が薄い。
5. Search Console の監視対象（main/store/fc）と monthly review への接続が未整理。

## 2. event taxonomy / naming / parameter 設計

## 2-1. 命名規則
- snake_case で統一。
- レイヤー分離:
  - page系: `page_view`, `join_page_view`
  - action系: `cta_click`, `select_item`, `join_cta_click`
  - conversion系: `add_to_cart`, `begin_checkout`, `login_success`
  - support系: `help_center_search`, `contact_submit_success`
  - error系: `error_404_view`, `error_page_cta_click`

### 2-2. 共通 parameter
- `sourceSite`, `locale`, `theme`, `pageType`
- `userState`, `authenticatedState`, `anonymousState`
- `sessionId`, `anonymousId`, `deviceType`, `referrerType`, `attributionState`
- `eventType`, `eventCategory`, `eventId`, `timestamp`
- consent: `consentAwareTrackingState`

### 2-3. PII 非送信ルール
- 送信禁止: email / 氏名 / 電話番号 / 住所 / 自由入力本文 / userId
- membership は `guest/logged_in` など識別不能な状態値のみ使用
- contact / support は本文を送らず、状態（start/confirm/success/fail）のみ送信

## 3. GA4 / GTM / Consent Mode 実装方針

### 3-1. 役割分担
- **アプリ側（このrepo）**: event taxonomy、payload整形、同意状態管理、重複送信抑止
- **GTM**: marketing tag 追加や検証用の運用層（必要時）
- **GA4**:主分析ストリーム

### 3-2. Consent Mode
- default: denied
- update: cookie consent の更新イベントで granted/denied 切替
- ad 系は常時 denied（analytics 基盤のみを対象）

### 3-3. page_view 二重送信防止
- `lastTrackedPath` で同一 pathname の連続送信を抑止
- `gtag('config', ..., { send_page_view: false })` を維持し、手動 `trackPageView` のみ送信

### 3-4. GTM 追加時の方針
- `VITE_GTM_CONTAINER_ID` がある場合のみ script 読み込み
- analytics 失敗時でも UI/導線は壊さない（非クリティカル）

## 4. main / store / fc イベント実装方針

### main
- Hero / About / Event / Store / FC 導線は `cta_click` + `location` / `cta`
- theme / locale 切替を `theme_toggle` / `locale_switch`

### store
- `view_item_list`（一覧表示）
- `select_item`（商品カード遷移）
- `view_item`（商品詳細）
- `add_to_cart`
- `begin_checkout`
- `view_cart`

### fc
- join/login/member 導線は `join_cta_click`, `login_attempt`, `login_success`, `member_gate_encounter` を基準
- 継続利用（update / mypage）は既存 `trackMizzzEvent` に共通属性を付与

## 5. support / error / search 計測

- support: `help_center_search`, `article_view`, `contact_form_start`, `contact_submit_success/fail`
- error: `error_404_view`, `error_500_view`, `error_503_view`, `error_page_cta_click`, `fallback_shown`
- search query は raw 本文を避け、必要時は語数やカテゴリ化など匿名加工を優先

## 6. Search Console 運用方針

### 6-1. property 戦略
- 推奨: Domain property（`mizzz.jp`）+ URL prefix（`https://store.mizzz.jp`, `https://fc.mizzz.jp`）
- 監視単位は main/store/fc で分離

### 6-2. weekly / monthly 確認項目
- coverage / indexing 異常
- sitemap 送信状況
- canonical 競合
- query / landing page の変化
- main → store / fc 導線ページの検索流入変化

## 7. KPI / dashboard（例）

- main Hero CTR
- main → store / fc 遷移率
- store: list→detail CTR, add_to_cart率, begin_checkout率
- fc: join CTA率, login成功率
- support: self-service率, contact完了率
- error page 離脱率

## 8. env / secrets / runtime

### frontend env
- `VITE_GA_MEASUREMENT_ID`
- `VITE_GTM_CONTAINER_ID`
- `VITE_ANALYTICS_DEBUG_MODE`
- `VITE_ANALYTICS_CONSENT_MODE`
- `VITE_ANALYTICS_OPS_ENDPOINT`

### GitHub Secrets / Variables（候補）
- `VITE_GA_MEASUREMENT_ID`
- `VITE_GTM_CONTAINER_ID`
- `ANALYTICS_OPS_TOKEN`
- `ANALYTICS_IP_HASH_SALT`

## 9. debug / validation 手順

1. Cookie banner で analytics denied → granted を切替
2. GA4 DebugView で `page_view`, `cta_click`, `view_item`, `add_to_cart`, `begin_checkout` を確認
3. GTM Preview で dataLayer / consent 更新イベント確認
4. network で PII を含む key が送られていないことを確認
5. adblock 環境でも画面機能が壊れないことを確認

## 10. よくあるトラブル

- page_view 二重送信: router change と auto page_view が重複
- consent 反映漏れ: banner state と runtime flag 不一致
- event 名のドリフト: docs と実装の命名が不一致
- internal traffic 混入: preview / admin の除外条件未整備

## 11. 残課題

1. Search Console 実運用（property作成・権限付与・sitemap submit）はコンソール操作が必要
2. Looker Studio dashboard のテンプレート化
3. BigQuery export と長期 retention 最適化
4. server-side tagging の必要性評価

## 12. 仮定

1. main / store / fc は同一運用チームで env / secrets を管理できる
2. 本PRでは GSC property 作成操作自体は行わず、runbook を先行整備する
3. ad personalization は現時点で要件外のため denied 固定
