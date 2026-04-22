# Supabase Auth 前提 alert / incident / approval / batch safe ops / escalation runbook（2026-04-22）

## 1. 現在の課題（調査結果）
- operations dashboard は queue/anomaly/reconciliation を俯瞰できるが、scheduled checks の定期実行と incident 化の責務が分離されていなかった。
- alert 検知、incident 化、approval、batch execute が同じ playbook 実行導線に寄り、状態遷移の監査根拠が薄かった。
- support / security / privacy / membership mismatch の滞留は見えるものの、「誰がいつ承認・実行したか」の summary が不足。
- batch 操作は safe action がある一方で preview / dry-run / execute の標準化された state が不足。

## 2. Operations control plane の責務分離
- 認証: `auth.users`（Supabase Auth）を単一認証基盤として利用。
- business state: app 側 user domain (`membershipStatus` / `entitlementState` / `subscriptionState` / `billingState` / `lifecycleStage`) を SoT とする。
- operations control plane: `internal_audit_log` を基盤に、scheduled check result / alert summary / incident summary / approval summary / batchOperation summary / escalation summary を生成。
- user-facing 情報（mypage）と internal incident/approval 情報（internal admin）を分離。

## 3. state モデル
- `scheduledCheckState`: `idle | queued | running | completed | failed | stale`
- `alertState`: `detected | acknowledged | triaging | grouped | resolved | ignored`
- `incidentState`: `open | in_review | waiting_approval | in_progress | mitigated | resolved | closed | escalated`
- `approvalState`: `not_required | pending | approved | rejected | expired`
- `batchOperationState`: `draft | preview_ready | dry_run_ready | pending_approval | approved | running | partial | succeeded | failed | canceled`
- `escalationState`: `none | pending | escalated | completed | resolved`

## 4. scheduled checks 一覧
- membership と entitlement mismatch
- billing と subscription mismatch
- notification failure spike
- privacy request stall
- security review stall
- support backlog spike
- summary sync stale

補足:
- check result と alert 生成を分離。
- detectedCount > 0 のみ alert 扱い。
- duplicate 抑制は `scheduled-check-run` の最新チェック結果を優先参照。

## 5. incident dashboard / triage
- API: `GET /api/internal/incidents/dashboard`
- summary-first で表示:
  - alertSummary
  - incidentSummary
  - approvalSummary
  - batchOperationSummary
  - escalationSummary
- triage API: `POST /api/internal/incidents/triage`
  - `acknowledge`
  - `create_incident`
  - `escalate`
  - `resolve`
- 「検知」「incident化」「承認」「実行」「解決」を別イベントとして監査ログへ記録。

## 6. approval workflow / batch safe ops
- approval API: `POST /api/internal/operations/approval`
- batch API: `POST /api/internal/operations/batch`
  - `mode=preview`
  - `mode=dry_run`
  - `mode=execute`（`confirmed=true` 必須）
- destructive 寄りの execute は `requiresApprovalState=required` を返し、即時確定させない。
- reason 8文字以上必須、監査ログへ `beforeState/afterState/metadata` を記録。

## 7. 役割分担
- support: read/triage 中心、危険実行不可。
- reviewer: incident triage と runbook 整理。
- approver: approval state の最終判断。
- executor: 承認後の batch execute 実行。
- super admin: 監査・例外対応。

## 8. RLS / permission 方針
- frontend は anon key のみ利用。
- privileged action は backend API 経由。
- service role key は backend / trusted server のみ。
- `requireInternalPermission` で read / run / approve を分離。

## 9. 計測イベント
- `incident_dashboard_view`
- `alert_list_view`
- `alert_acknowledge`
- `incident_open`
- `incident_resolve`
- `approval_request_create`
- `approval_request_approve`
- `approval_request_reject`
- `batch_preview_view`
- `batch_dry_run_start`
- `batch_dry_run_complete`
- `batch_execute_start`
- `batch_execute_complete`
- `escalation_start`
- `escalation_complete`
- `related_user360_open`
- `related_case_open`

## 10. env / GitHub Secrets / runtime
### backend runtime env
- `SUPABASE_JWT_ISSUER`
- `SUPABASE_JWKS_URI`
- `SUPABASE_JWT_AUDIENCE`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPS_STALE_THRESHOLD_HOURS`
- `OPS_INCIDENT_STALE_HOURS`
- `OPS_ALERT_COOLDOWN_MINUTES`
- `OPS_BATCH_MAX_TARGETS`
- `OPS_APPROVAL_EXPIRE_HOURS`

### frontend runtime env
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_INTERNAL_ADMIN_CONSOLE_ENABLED`

### GitHub Secrets（CI/CD）
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRAPI_API_TOKEN`
- `ANALYTICS_OPS_TOKEN`

## 11. local / staging / production 確認手順
1. internal admin で scheduled checks を manual 実行。
2. incident dashboard の alert/incident/approval/batch/escalation summary を更新。
3. triage（ack→incident化→escalate→resolve）を実施。
4. batch を preview→dry-run→execute(confirm) で実施。
5. approval request を pending→approved/rejected で確認。
6. internal audit log で時系列を追跡。

## 12. よくあるトラブル
- scheduled checks が 0 件: source data テーブルの更新停止を確認。
- approval が pending のまま: approver 権限（`internal.playbook.approve`）不足を確認。
- execute が拒否: `confirmed=true` と reason 長さを確認。
- incident stale 増加: owner assignment が未実施。

## 13. 仮定
- queue worker / cron 実行基盤は既存ジョブ基盤を流用し、今回は manual trigger + API 化を先行。
- 既存 internal permission (`internal.playbook.run/approve`) を reviewer/approver の最小境界として利用。
- dedicated incident DB テーブルは次段で追加し、今回は `internal_audit_log` を summary の一次ストアとして利用。
