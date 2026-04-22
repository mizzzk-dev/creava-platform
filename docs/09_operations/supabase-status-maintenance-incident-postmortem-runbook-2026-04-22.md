# Supabase Auth 前提 status page / maintenance notice / incident communication / postmortem / RCA / incident knowledge base runbook（2026-04-22）

## 0. 目的
- 対象: `mizzz.jp`（main）/ `store.mizzz.jp`（store）/ `fc.mizzz.jp`（fanclub）。
- 前提: Supabase Auth は単一基盤、`auth.users` は認証、business state は app 側 user domain を正とする。
- ゴール: internal incident を user-facing status communication へ安全に変換し、復旧後に postmortem / RCA / knowledge まで残す。

## 1. 現在の運用課題（実装調査結果）
1. incident dashboard は internal 向け summary が中心で、public status へ公開する導線が無かった。
2. maintenance / outage / degraded performance の user-facing 用語が統一されていなかった。
3. support / notification center から incident context へ遷移する導線が弱かった。
4. postmortem / RCA / corrective action を一貫保存する API が無く、監査ログへ散在していた。
5. publish 操作の責務（draft/review/publish）が明示されていなかった。

## 2. 情報設計（incident communications and learning layer）
### 2.1 分離した state
- internal incident state: `open | in_review | escalated | resolved ...`
- public status state: `operational | maintenance_scheduled | maintenance_in_progress | degraded_performance | partial_outage | major_outage | recovering | resolved`
- incident communication phase: `draft | internal_review | published | update_posted | resolved_notice_posted | postmortem_pending | closed`
- postmortem state: `not_started | drafting | internal_review | public_ready | published | archived`
- publishing state: `draft | review | published`

### 2.2 追加した summary 概念
- `publicStatusSummary`
- `maintenanceSummary`
- `incidentCommunicationSummary`
- `postmortemSummary`
- `knowledgeSummary`
- `rcaState` / `rootCauseCategory` / `correctiveActionState` / `preventionActionState`

## 3. 実装方針
### 3.1 backend API
- `GET /api/status/public-summary`
  - public-facing summary（published のみ）を返却。
  - sourceSite ごとに `cross/main/store/fc` をフィルタ。
- `GET /api/internal/incidents/communications/dashboard`
  - draft/review/published / stale / postmortem pending を internal 向けに集計。
- `POST /api/internal/incidents/communications/publish`
  - publish/update/resolve/postmortem-ready を監査ログへ記録。
  - `targetType=incident-communication`、`metadata` に communication/postmortem/knowledge summary を保持。

### 3.2 frontend
- `/status` ページを main/store/fc 共通ルートとして追加。
- support center / notification center に status notice panel を追加。
- footer に status 導線を追加（平常時は控えめ、障害時に見つけやすく）。

### 3.3 internal admin
- incident dashboard 配下に communications panel を追加。
- `communications 更新` / `public notice publish` / `resolved notice` を分離。
- internal incident triage と public publish 操作を別 API で実行。

## 4. RLS / access / publishing policy（現段階）
- `internal.status.read`: support 以上で閲覧可能。
- `internal.status.publish`: internal_admin / super_admin で publish 可能。
- public API は published summary のみ返し、raw incident detail を返さない。
- frontend に service role key は持たせない。

## 5. analytics / audit
- 追加イベント:
  - `status_page_view`
  - `maintenance_notice_view`
  - `active_incident_view`
  - `recovery_notice_view`
  - `resolved_notice_view`
  - `postmortem_view`
  - `status_cta_support_click`
  - `status_cta_notification_click`
  - `incident_notice_banner_view`
  - `incident_notice_banner_click`
  - `maintenance_schedule_publish`
  - `incident_status_publish`
  - `recovery_status_publish`
  - `postmortem_publish`
  - `knowledge_article_from_incident_open`
  - `related_support_article_open`

## 6. env / secrets 運用
- backend:
  - `STATUS_PUBLIC_HISTORY_LIMIT`
  - `STATUS_PUBLISH_REQUIRE_APPROVAL`
- frontend:
  - `VITE_STATUS_FETCH_TIMEOUT_MS`
  - `VITE_STATUS_FETCH_RETRY_COUNT`
- GitHub Secrets:
  - `SUPABASE_SERVICE_ROLE_KEY`（backend runtime のみ）
  - `ANALYTICS_OPS_TOKEN`（ops API 保護）

## 7. runbook（運用手順）
1. internal dashboard で alert/incident を確認（triage）。
2. 影響確定後に communication draft を作成。
3. reviewer が文面確認し publish。
4. 復旧時に resolved notice を publish。
5. postmortem/rca/corrective action を追記。
6. knowledge article を公開し support FAQ と紐づけ。

## 8. トラブルシューティング
- status page が空の場合:
  - publish 済み (`publishingState=published`) のレコードがあるか確認。
  - sourceSite が `cross` または対象サイトに一致しているか確認。
- internal publish が 403 の場合:
  - JWT claims の role に `internal_admin` 以上が含まれるか確認。

## 9. 仮定
- dedicated incident テーブルは次段で追加予定。今回は `internal_audit_log` を summary source とする。
- reviewer/approver の厳密分離は permission claim 拡張で次段対応可能な設計に留める。
- public postmortem 本文ページは次段で追加し、今回は summary 導線まで提供する。
