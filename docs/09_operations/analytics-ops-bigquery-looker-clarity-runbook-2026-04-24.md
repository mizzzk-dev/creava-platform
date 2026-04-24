# analytics ops 基盤 runbook（BigQuery / Looker Studio / Clarity / funnel / attribution / anomaly）

- 更新日: 2026-04-24
- 対象: `mizzz.jp`（main） / `store.mizzz.jp`（store） / `fc.mizzz.jp`（fanclub）
- 目的: 「計測できる」状態から「毎週・毎月の意思決定に使える」状態へ移行する
- 関連: `frontend/src/modules/analytics/index.ts`, `frontend/src/modules/analytics/context.ts`, `backend/src/api/analytics-event/*`, `frontend/.env.example`, `backend/.env.example`

## 1. 現状確認と切り分け（2026-04-24 時点）

### 1-1. 調査結果（有無）
- GA4 実装: **あり**（`initializeAnalytics`, `trackPageView`, `trackEvent`）。
- GTM 実装: **あり**（`VITE_GTM_CONTAINER_ID` がある場合のみ script 読み込み）。
- Search Console 運用: **runbook は存在**、コンソール側の property 設定は運用タスク。
- BigQuery Export: **本リポジトリ内に実 export 実装は未整備**（方針・env を追加）。
- Looker Studio: **ダッシュボード URL を持つ設計は未整備**（env と設計を追加）。
- Clarity / replay / heatmap: **実装未整備**（本対応で frontend に導入フック追加）。
- custom event / ecommerce event: **あり**（`view_item`, `add_to_cart`, `begin_checkout`, `join_cta_click`, `contact_submit_success` など）。
- membership / login / signup / support / search / error: **イベント語彙としてはあり**。
- dashboard / KPI / funnel / attribution 運用: **基礎 runbook はあるが weekly/monthly オペレーション不足**。
- internal / bot / preview 除外: **運用方針が弱い**（本対応で `analyticsTrafficQualityState` を追加）。
- consent / privacy / masking: **GA4/GTM 側は整備済み、replay 側の masking 方針が未整理**。

### 1-2. 問題点（最初にまとめること）
1. analytics 活用の問題点
   - raw event は取得できるが、dashboard / alert / 定例運用まで接続されていない。
2. dashboard / KPI 不足
   - main/store/fc 共通 KPI と専用 KPI の責務分離が不足。
3. BigQuery 活用不足
   - raw event を export した後の modeled テーブル責務が未定義。
4. replay / heatmap 不足
   - 定量で原因不明の UX 問題を掘る導線がない。
5. funnel / attribution / anomaly monitoring 不足
   - 変化の理由を追える定義（funnel）と、放置を防ぐ alert が不足。
6. consent / privacy / masking の課題
   - replay 系で同意・マスキング・除外範囲を明文化できていない。
7. すぐやるべき整理
   - KPI 定義の固定、BigQuery export 境界、Looker Studio dashboard 分割、Clarity 同意連動。
8. 恒久対応の実装順
   - 本 runbook の 2〜8 章の順で、環境ごとに段階導入。
9. 作業ブランチ名案
   - `feature/analytics-ops-and-attribution`

## 2. BigQuery Export / data model / KPI 定義

### 2-1. レイヤー分離（最重要）
- **raw event layer**: GA4 export + Strapi `analytics-event` の生データ。
- **modeled KPI layer**: `kpi_daily`, `funnel_daily`, `attribution_daily`, `alert_signal_daily`。
- **BI serving layer**: Looker Studio の可視化用 view / extract。
- **ops layer**: anomaly alert + weekly/monthly report。

### 2-2. 必須 state 概念（実装方針）
`analyticsRawEventState`, `analyticsKpiState`, `analyticsFunnelState`, `analyticsAttributionState`, `analyticsReplayState`, `analyticsConsentState`, `analyticsTrafficQualityState`, `analyticsSourceSiteState`, `analyticsLocaleState`, `analyticsThemeState`, `analyticsMembershipState`, `analyticsEcommerceState`, `analyticsSupportState`, `analyticsErrorState`, `analyticsReportState`, `analyticsAlertState`, `analyticsTraceId`, `analyticsCollectedAt` を payload に含め、raw→modeled 解釈を安定化する。

### 2-3. 共通ディメンション
- `sourceSite`, `locale`, `theme`, `deviceType`, `referrerType`, `eventType`, `eventCategory`
- `sessionId`, `anonymousId`, `eventId`, `analyticsTraceId`
- traffic quality: `production/internal/preview/bot_like`

### 2-4. KPI 定義（共通 + 専用）
- 共通: sessions, engaged_sessions, cta_ctr, support_self_service_rate, error_exit_rate
- main: hero_ctr, about_reach_rate, event_section_ctr, main_to_store_rate, main_to_fc_rate
- store: list_to_detail_rate, add_to_cart_rate, begin_checkout_rate, cart_abandonment_watch, faq_reach_rate
- fc: join_cta_ctr, login_success_rate, member_gate_reach_rate, member_content_reach_rate, fc_to_store_rate

### 2-5. BigQuery export 境界
- export するもの: GA4 event export（標準）+ Strapi mirror event（補助）
- modeled で解決するもの: 重複除去、null parameter 補完、traffic quality 除外、funnel step 正規化
- dashboard でのみ解決するもの: 表示粒度、期間比較、注釈

## 3. Looker Studio / dashboard / report 設計

### 3-1. dashboard 分割
- 統合 overview dashboard（経営・横断責任者向け）
- main dashboard（ブランド導線）
- store dashboard（EC 導線）
- fc dashboard（会員導線）
- weekly review dashboard（異常・短期変化）
- monthly review dashboard（構造改善・学習）

### 3-2. 必須ビュー
- acquisition / engagement / conversion
- support / search / error
- sourceSite 比較、locale 比較、device 比較、channel 比較
- date comparison + annotation（release/campaign/content 更新日）

### 3-3. KPI 説明の置き方
- 各 scorecard に「定義」「計算式」「除外条件（internal/preview/bot）」を記載。
- definition 不在の数字を表示しない。

## 4. Clarity / session replay / heatmap / masking

### 4-1. 導入範囲
- Phase 1: main / store / fc の主要導線ページ（home, product list/detail, join/login, support）
- Phase 2: 離脱率が高いページのみ replay 深掘り

### 4-2. privacy / consent
- 同意前は script を初期化しない。
- form input / 会員情報 / 問い合わせ本文は常時 mask。
- 管理画面・preview・staging を replay 対象から除外。

### 4-3. replay の使い方
- rage click / dead click / scroll gap を発見 → GA4 funnel と突合。
- replay 単体で結論を出さず、funnel + attribution と併用する。

## 5. funnel / attribution / anomaly alert

### 5-1. funnel 定義
- main funnel: `page_view(home) -> cta_click(hero/about/event) -> main_to_store_or_fc`
- store funnel: `view_item_list -> select_item -> view_item -> add_to_cart -> begin_checkout`
- fc funnel: `join_page_view -> join_cta_click -> sign_up_attempt/login_attempt -> login_success -> member_gate_encounter`
- support funnel: `help_center_search -> article_view -> article_helpful/contact_submit_success`

### 5-2. attribution 定義（実務向け）
- 既定: `last_touch`
- 併記: channel grouping（organic / direct / referral / paid / social）
- subdomain 導線は `sourceSite` と landing path で補完
- campaign tagging: `utm_source`, `utm_medium`, `utm_campaign` を必須化

### 5-3. anomaly alert
- alert 条件
  - KPI 下振れ: セッション母数が閾値以上かつ CVR が前週比 -30% 超
  - error 増加: `error_*` 系イベントが前週比 +50% 超
  - conversion drop: `begin_checkout` または `login_success` の急落
- ノイズ抑制
  - cooldown 120 分
  - min sessions 200
  - preview/internal/bot_like を除外

## 6. weekly / monthly analytics ops

### 6-1. 週次（運用）
- 観点: 異常検知、施策の短期変化、障害兆候
- 出力: top 3 anomalies / 要調査 funnel / 次週アクション

### 6-2. 月次（改善）
- 観点: 構造改善、導線最適化、学習の蓄積
- 出力: 継続施策 / 停止施策 / 新規施策 backlog

### 6-3. ownership
- main KPI owner: brand/content
- store KPI owner: ecommerce/ops
- fc KPI owner: membership/auth
- support/error KPI owner: support/engineering

## 7. privacy / consent / legal alignment

- PII 非送信（email, phone, name, userId, free text）を継続。
- BigQuery/Looker には pseudonymous ID + state 値のみ。
- consent 状態を event payload へ保存し、同意前 optional tracking を無効化。
- privacy policy / cookie policy の記載と runbook を同期。

## 8. env / GitHub Secrets / runtime / docs

### 8-1. 追加した env（今回）
- frontend: `VITE_CLARITY_PROJECT_ID`, `VITE_CLARITY_MASKING_MODE`, `VITE_ANALYTICS_ALERT_*`, `VITE_LOOKER_STUDIO_DASHBOARD_URL`, `VITE_SEARCH_CONSOLE_PROPERTY_*`
- backend: `ANALYTICS_BIGQUERY_*`, `ANALYTICS_LOOKER_STUDIO_*`, `ANALYTICS_CLARITY_*`, `ANALYTICS_ANOMALY_*`, `ANALYTICS_INTERNAL_HOST_PATTERNS`

### 8-2. secrets 責務
- runtime secrets: backend env（BigQuery service account / alert webhook）
- CI secrets: GitHub Actions deploy 時注入
- frontend に秘密鍵や service account を置かない

## 9. 確認手順

1. 同意 denied -> granted で GA4/GTM/Clarity の起動差分を確認
2. `page_view` / `cta_click` / `add_to_cart` / `login_success` の payload に state 概念が乗ることを確認
3. `analyticsTrafficQualityState` が local/staging で `internal/preview` になることを確認
4. ops endpoint で PII キーが保存されていないことを確認
5. Looker Studio（接続後）で site別 KPI が分離表示されることを確認

## 10. 定例レポートテンプレート

### 10-1. weekly template
- 今週の主要変化（main/store/fc）
- anomaly 一覧（原因仮説 / 対応者 / 期限）
- funnel 劣化ステップ
- replay 確認メモ（必要時のみ）

### 10-2. monthly template
- 目標 KPI 達成率
- 寄与チャネル/施策
- 継続・停止判断
- 次月の検証テーマ

## 11. 残課題

1. GA4 管理画面で BigQuery linked dataset の実作成（コンソール作業）
2. Looker Studio の実画面作成（接続先ID・権限設定）
3. Clarity project 本番発行と法務レビュー
4. alert webhook の実接続（Slack/Teams/PagerDuty など）
5. server-side tagging / LTV / content ROI / experiment analysis layer は次PR

## 12. 仮定

1. main/store/fc は同一 GA4 property 内で `sourceSite` 分析できる運用とする。
2. BigQuery dataset は GCP 側で作成権限があり、backend runtime から到達可能とする。
3. Clarity は同意済みユーザーのみ対象にし、masking を strict で運用する。
4. Search Console property 作成・権限付与は運用チームが実施する。
