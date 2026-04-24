# experimentation platform / feature flags / KPI guardrails / statistical review / rollout workflow runbook（2026-04-24）

- 対象: `mizzz.jp`(main) / `store.mizzz.jp`(store) / `fc.mizzz.jp`(fc)
- 目的: 「見える状態」から「安全に改善施策を試して採用判断できる状態」への移行
- 前提: GA4 / GTM / Search Console / BigQuery / Looker Studio / Clarity 導入後

## 1. 現状確認と問題点（2026-04-24 時点）

1. assignment / exposure / outcome はイベント名が存在するが、実験定義（KPI / guardrail / decision）との紐づけが弱い。
2. store の A/B は `localStorage` ベースの単純ランダムで、traffic quality（internal/preview/bot）除外がない。
3. main / fc / support では実験対象を同一 framework で扱う仕組みが不足していた。
4. release flag と experiment flag の運用境界が docs 上で分断しており、実装参照ポイントが散在していた。
5. exposure の重複抑制・consent 前抑制・traceId の運用が runbook に定着していなかった。

## 2. taxonomy / naming / KPI / guardrail 設計

### 2-1. 必須状態モデル

- `experimentState`: draft / running / paused / completed / stopped / invalidated
- `experimentVariantState`: control / challenger
- `experimentExposureState`: not_exposed / eligible / exposed / blocked / suppressed
- `experimentAssignmentState`: not_assigned / assigned / sticky_assigned / excluded
- `experimentSuccessMetricState`: 実験ごとの一次指標
- `experimentGuardrailState`: healthy / warning / breached
- `experimentDecisionState`: pending / win / lose / inconclusive / rollback
- `experimentRollbackState`: ready / triggered / completed
- `experimentConsentState`: consented / required_only
- `experimentSeoState`: safe / review_required
- `experimentAccessibilityState`: safe / review_required
- `experimentTraceId`: `experimentId:sessionId:timestamp`
- `experimentStartedAt` / `experimentExposedAt` / `experimentReviewedAt` / `experimentClosedAt`

### 2-2. naming ルール

- experiment id: `{site}-{surface}-{goal}-{yyyymm}`
  - 例: `main-hero-cta-2026q2`, `store-hero-cta-2026q2`
- variant id: `control` / `challenger`（A/B表記は表示層のみ）
- exposure point: `{site}:{surface}`

### 2-3. KPI / secondary / guardrail 分離

- **main** 成功指標: `main_to_store_or_fc_ctr`
- **store** 成功指標: `begin_checkout_rate`
- **fc** 成功指標: `login_success_rate`
- **support** 成功指標: `help_center_search_to_article_rate`
- guardrail は各サイトの導線破壊を検知するため別指標（error/contact/gate/block）を採用

## 3. feature flag / experiment flag / release flag の責務分離

- feature flag: 機能の ON/OFF 管理（恒常機能）
- experiment flag: 比較検証のための割当・露出・判定管理
- release flag: 段階公開とロールバックの運用管理

> 「表示を出し分けた」ことと「勝ちを判定した」ことは別管理にする。

## 4. assignment / exposure / decision 実装方針

### 4-1. assignment

- `anonymousId` + `sourceSite` + `assignmentSalt` の hash バケットで sticky assignment。
- rollout percentage は `VITE_EXPERIMENT_DEFAULT_ROLLOUT_PERCENT` で制御。
- `internal/preview/bot_like` は `excluded` 扱いで control 固定。

### 4-2. exposure

- 同意前は `suppressed`（optional tracking を送らない）。
- 同意後のみ `exposure_event_logged` を送信。
- `experimentId:variantId:pathname` 単位で重複防止。

### 4-3. decision

- `experiment_decision_logged` を採用判断の記録点にする。
- `win/lose/inconclusive/rollback` を明示し、review timestamp を必須化する。

## 5. site 別の実験対象

### main

- Hero/CTA の比較（導線 CTR と scroll 到達率）
- Home section order（Latest / PersonalizedHub）を variant 切替

### store

- Hero copy / primary CTA variation
- ranking セクション演出
- guardrail: cart error rate / support increase

### fc

- Hero lead copy（join/login 文脈）
- guardrail: member gate blocked rate

### support/help

- quick link 配置順（guide/faq 優先化）
- guardrail: contact submit 増加、empty search 増加

## 6. BigQuery / Looker Studio / Clarity 連携

- BigQuery は assignment / exposure / conversion を別テーブルで保持し、後段モデルで join。
- Looker Studio は `sourceSite` と `experimentId` で切替可能にする。
- Clarity は補助証拠として利用し、勝敗判定の単独根拠にしない。

## 7. rollout / rollback / review workflow

1. proposal 作成（仮説・KPI・guardrail・停止条件）
2. reviewer 承認
3. rollout 10%→25%→50%→100%
4. guardrail breach なら pause / rollback
5. statistical review（週次）
6. decision 記録（win/lose/inconclusive）
7. winning variant を release flag へ移行
8. archive（learn log と changelog を保存）

## 8. privacy / consent / SEO / accessibility

- PII / 自由入力本文 / 会員識別子は experiment metadata に含めない。
- consent 前は assignment はローカル評価のみ、exposure/event 送信は抑制。
- SEO 影響領域は canonical/index/structured data を変えない。
- copy/layout 変更時は focus order / 見出し / aria を回帰確認する。

## 9. env / runtime / secrets

frontend で運用する主な環境変数:

- `VITE_ANALYTICS_EXPERIMENT_TRACKING_ENABLED`
- `VITE_EXPERIMENT_RUNTIME_ENABLED`
- `VITE_EXPERIMENT_DEFAULT_ROLLOUT_PERCENT`
- `VITE_EXPERIMENT_DECISION_REVIEW_REQUIRED`
- `VITE_EXPERIMENT_GUARDRAIL_AUTO_PAUSE`
- `VITE_EXPERIMENT_TRAFFIC_ALLOWLIST`
- `VITE_EXPERIMENT_EXCLUDE_PREVIEW`
- `VITE_EXPERIMENT_EXCLUDE_INTERNAL`
- `VITE_EXPERIMENT_EXCLUDE_BOT`

## 10. 実施チェックリスト

- assignment が sticky である
- exposure が重複送信されない
- consent denied で optional experiment event が送信されない
- main / store / fc / support で variant が分離される
- guardrail breach の検知手順がある
- rollout / rollback の操作と decision 記録が分離されている

## 11. よくある失敗

- assignment event と exposure event を同一 event として扱う
- preview traffic を本番判定に混ぜる
- `A/B 表示` だけで勝敗を確定する
- guardrail 未定義で rollout を開始する

## 12. 仮定

1. BigQuery export dataset と Looker Studio 接続は既存 runbook の構成を継続利用する。
2. 統計判定（頻度論/ベイズ）の計算実装は次 PR で SQL モデル化する。
3. server-side / edge assignment は次段で導入し、今回は client-side sticky assignment を baseline とする。
