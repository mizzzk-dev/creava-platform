# Supabase Auth 前提 operations dashboard / queue / anomaly / reconciliation / safe playbook runbook（2026-04-22）

## 1. 現在の運用ダッシュボード / 全体監視課題
- これまでの internal admin / user 360 は「個別ユーザー調査」中心で、全体の backlog / 異常 / 再処理優先度を俯瞰しづらかった。
- support / notification / privacy / security / membership の未処理が機能別に分散し、triage 順序の判断が属人化していた。
- `auth.users` は認証の source だが、business state（membership / entitlement / billing / lifecycle）は app user domain 側が正であるため、運用判断に必要な正規化 summary が不足していた。

## 2. 情報設計（責務分離）
- **auth source**: Supabase Auth（`auth.users`）
- **business source of truth**: app user domain（`app-user`）
- **operations summary source**: backend `/api/internal/operations/dashboard` で集約した read-heavy summary

### state 分離
- `queueState`: 未処理滞留状態
- `anomalyState`: 異常検知状態
- `reconciliationState`: 再整合処理の必要状態
- `playbookState`: 実行テンプレート状態
- `opsPriorityState`: 運用優先度

## 3. API 基盤
- `GET /api/internal/operations/dashboard`
  - `operationsSummary`, `kpiSummary`, `queueSummary`, `anomalySummary`, `reconciliationSummary`, `playbookSummary` を返却。
- `POST /api/internal/operations/safe-action`
  - safe retry / safe resync の起点。
  - `reason` 必須（8文字以上）。
  - 危険操作は `dryRun=false` 時に `confirmed=true` を必須化。
  - 実行結果は `internal-audit-log` に記録。

## 4. KPI / queue / anomaly / reconciliation
- KPI:
  - open support cases
  - waiting user count
  - unresolved critical issues
  - notification failures
  - pending privacy actions
  - security reviews
  - reconciliation needed count
- queue 例:
  - `support_backlog`
  - `notification_retry`
  - `privacy_export_pending`
  - `security_review_pending`
- anomaly 例:
  - `membership_entitlement_mismatch`
  - `support_backlog_spike`
  - `notification_delivery_spike`
  - `stale_summary_detected`
- reconciliation 例:
  - `membership_sync`
  - `privacy_processing`
  - `notification_delivery`

## 5. safe operation と privileged action の違い
- safe operation:
  - read-heavy dashboard から実行。
  - dry-run / reason / audit を前提。
  - 直接の destructive 処理は実行しない。
- privileged action:
  - 既存 internal permission + backend endpoint でのみ実行。
  - 別途承認/実処理 runbook を要求。

## 6. 権限・RLS方針
- frontend は anon key のみ利用。
- `SUPABASE_SERVICE_ROLE_KEY` は backend runtime 限定。
- internal operations API は `requireInternalPermission` により `internal.user.read` / `internal.playbook.run` 等を強制。
- summary 表示権限と action 実行権限を分離（閲覧と実行を混同しない）。

## 7. 計測イベント（operations dashboard 追加）
- 閲覧系: `operations_dashboard_view`
- 要約閲覧: `queue_summary_view`, `anomaly_summary_view`, `reconciliation_summary_view`, `playbook_summary_view`
- drilldown: `queue_drilldown_open`, `anomaly_drilldown_open`, `reconciliation_drilldown_open`
- 操作系: `safe_retry_start/complete`, `resync_start/complete`, `resend_start/complete`, `playbook_start/complete`
- 遷移系: `related_user360_open`, `related_case_open`

## 8. GitHub Secrets / runtime env
- 追加 runtime env:
  - `OPS_STALE_THRESHOLD_HOURS`
- 継続利用:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`（backend のみ）
  - `PLAYBOOK_APPROVAL_AUDIENCE_THRESHOLD`, `PLAYBOOK_SAFE_MODE_DEFAULT`, `PLAYBOOK_RETRY_LIMIT`

## 9. local / staging / production 確認手順
1. internal role（support/admin）でログイン。
2. `/internal/admin` の operations dashboard セクションで summary 更新。
3. queue/anomaly/reconciliation/playbook summary を確認。
4. safe action を dry-run 実行し、結果 JSON と監査ログ記録を確認。
5. dangerous action を confirm 付きで実行し、pending_confirmation になることを確認。

## 10. よくあるトラブル
- summary が空: seed データ不足、または role 権限不足。
- safe action が 400: reason 文字数不足、または dangerous action で confirm 未指定。
- stale_summary_detected 多発: `OPS_STALE_THRESHOLD_HOURS` が厳しすぎる可能性。

## 11. 仮定
- privacy queue 専用テーブルは未導入のため、app user domain の privacy 関連 state を pending 指標として利用。
- operations dashboard は phase 1 とし、実ワーカーによる queue 実行や incident dashboard は次PRで拡張する。
- support/internal admin/user360 の既存導線は維持し、今回の変更は internal admin の dashboard 強化を優先。
