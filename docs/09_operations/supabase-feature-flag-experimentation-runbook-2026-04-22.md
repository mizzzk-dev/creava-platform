# Supabase Auth 前提 feature flag / experimentation / staged exposure / kill switch runbook

- 更新日: 2026-04-22
- 対象: main (`mizzz.jp`) / store (`store.mizzz.jp`) / fc (`fc.mizzz.jp`)
- 前提: 認証は Supabase Auth 単一基盤。`auth.users` は認証の source of truth、公開制御の source of truth は app 側 summary + internal audit。

## 1. 現状確認（既存実装の課題）

1. release dashboard はあるが、runtime exposure control（誰に・いつ・何を見せるか）を独立した control plane として扱えていなかった。
2. experimentation 相当は frontend localStorage のみで、support/internal から assignment/exposure 理由を追跡できなかった。
3. staged exposure / kill switch が release action metadata に寄っており、flag と release の責務が混在していた。
4. audience targeting 条件（membershipStatus / entitlementState / lifecycleStage / locale / site）の説明可能性が不足していた。
5. kill switch は release rollback と同列になりがちで、「機能公開停止」と「デプロイ戻し」が混同されていた。

## 2. 責務分離（今回の方針）

- 認証: Supabase Auth (`auth.users`)
- business state: `app-user` domain（membership / entitlement / lifecycle / billing / subscription）
- runtime exposure control plane: `internal_audit_log` の `ops-flag:*` action + backend evaluation summary
- release control plane: `internal_audit_log` の `ops-release:*`
- incident/status communication: `ops-incident:*` / `ops-status:*`

### 状態モデル

- `featureFlagState`: draft / inactive / active_limited / active_partial / active_full / paused / disabled / archived
- `experimentState`: draft / ready / running / paused / completed / stopped / invalidated
- `assignmentState`: not_assigned / assigned / sticky_assigned / reassigned / excluded
- `exposureState`: not_exposed / eligible / exposed / blocked / suppressed
- `killSwitchState`: unavailable / available / armed / triggered / reset_pending
- `audienceEligibilityState`: eligible / excluded / unknown

## 3. Dashboard と API

### Internal API

- `GET /api/internal/flags/dashboard`
  - flagSummary / experimentSummary / exposureSummary / audienceSummary / killSwitchSummary / evaluationSummary を返す。
- `GET /api/internal/flags/evaluation`
  - flagKey, membershipStatus, entitlementState, lifecycleStage, locale, sourceSite, rolloutPercentage を受け、説明可能な evaluation を返す。
- `POST /api/internal/flags/action`
  - preview / simulate / approve / execute / pause / kill_switch_trigger / reset。
  - 実行内容を `internal_audit_log` に記録し、`ops-flag:*` action として監査可能にする。

### Internal UI

- Internal Admin Console に flag dashboard セクションを追加。
- summary-first（active/risky/running/kill switch ready）→ drilldown JSON の順で確認可能。
- evaluation preview / staged rollout dry-run / kill switch trigger を同一導線で操作可能。

## 4. 権限モデル

- `internal.flag.read`: summary / evaluation 閲覧
- `internal.flag.approve`: reviewer/approver 操作
- `internal.flag.execute`: staged rollout 実行
- `internal.flag.emergency`: kill switch 実行

> emergency 権限は super_admin / internal_admin に限定。support/crm/read_only は read のみ。

## 5. approval / execute / disable / reset の境界

- preview/simulate: 実行前確認（基本 dry-run）
- approve: 実行権限とは分離
- execute: staged exposure を進める（release/deploy と分離）
- kill_switch_trigger: runtime 露出を緊急停止（rollback とは別）
- reset: kill switch 復旧準備

## 6. support / incident / release 連携

- release dashboard と flag dashboard を分離しつつ、同じ internal audit 基盤で追跡。
- incident 対応時は `kill_switch_trigger` の action ログを起点に status/update の判断を行う。
- support は evaluation reason を参照し、「なぜ見えているか」を説明可能にする。

## 7. 計測イベント（今回追加）

- `flag_dashboard_view`
- `flag_summary_view`
- `flag_evaluation_view`
- `rollout_percentage_change`
- `staged_rollout_start`
- `staged_rollout_pause`
- `staged_rollout_resume`
- `experiment_start`
- `experiment_pause`
- `experiment_complete`
- `experiment_stop`
- `kill_switch_preview_view`
- `kill_switch_trigger_start`
- `kill_switch_trigger_complete`
- `exposure_reason_view`

## 8. 環境変数

### frontend

- `VITE_RUNTIME_EXPOSURE_CONTROL_ENABLED`
- `VITE_FLAG_DASHBOARD_ENABLED`
- `VITE_FLAG_EVALUATION_CACHE_TTL_SEC`
- `VITE_FLAG_KILL_SWITCH_CONFIRM_REQUIRED`

### backend

- `FEATURE_FLAG_CONTROL_PLANE_ENABLED`
- `FLAG_EVALUATION_CACHE_TTL_SEC`
- `FLAG_DEFAULT_ROLLOUT_PERCENTAGE`
- `FLAG_KILL_SWITCH_REQUIRE_APPROVAL`
- `FLAG_KILL_SWITCH_MAX_LATENCY_MS`
- `FLAG_AUDIENCE_RULESET_VERSION`
- `EXPERIMENT_ASSIGNMENT_STICKY_DAYS`

## 9. local / staging / production 確認手順

1. `GET /api/internal/flags/dashboard` が 200 で summary を返す。
2. `GET /api/internal/flags/evaluation` で membershipStatus/entitlementState 差分を確認。
3. `POST /api/internal/flags/action` dry-run execute で監査ログが作成されることを確認。
4. `kill_switch_trigger` 実行時に `featureFlagState=disabled` かつ `killSwitchState=triggered` が残ることを確認。
5. release dashboard の表示が変わらず、release/flag の責務分離が維持されることを確認。

## 10. よくあるトラブル

- `Internal permission denied: internal.flag.*`
  - internal roles claim に必要 role がない。JWT claims を確認。
- evaluation が stale
  - `FLAG_EVALUATION_CACHE_TTL_SEC` が長すぎるか、再評価導線が未実行。
- kill switch が遅い
  - backend action は成功しているか、frontend 側 cache invalidation が不足していないか確認。

## 11. 仮定

- flag detail の永続テーブルは次PRで追加し、今回は `internal_audit_log` を control plane summary の一次基盤として利用。
- experiment result analysis hub は既存 BI と接続予定だが、今回は assignment/exposure 追跡を優先。
- Supabase RLS の本実装は app DB テーブル設計確定後に段階導入し、今回は backend permission で action を保護。
