# Supabase Auth 前提 release management / deployment safety / rollback / parity / release notes runbook（2026-04-22）

## 0. 目的
- main / store / fc を横断し、**deploy・rollout・verification・rollback・communication** を混同せずに管理する。
- 単一 Supabase Auth（`auth.users`）は認証のみ、release control は app 側 summary/audit を source of truth として扱う。
- 「早く出す」より「安全に出して安全に戻せる」を優先する。

## 1. 現状確認（2026-04-22 時点）

### 1-1. CI / CD / deploy
- `.github/workflows/ci.yml`
  - frontend test/lint/build と backend build を実施。
  - PR metadata artifact は保存されるが、release approval / rollout / rollback の状態管理は持たない。
- `.github/workflows/deploy.yml`
  - frontend は `main`/`staging` push で FTP deploy。
  - site ごとの matrix deploy はあるが、staged rollout / parity gate / rollback readiness は未管理。
- `.github/workflows/deploy-backend.yml`
  - workflow_dispatch で backend を Strapi Cloud/VPS に deploy。
  - migration risk / config drift / freeze 判定は人力。
- `.github/workflows/ops-monitoring.yml`
  - health/ready と基本 route check を定期実行。
  - deploy 前 gate ではなく、deploy 後監視が中心。

### 1-2. release / rollback 運用課題
1. PR merge / deploy / rollout / verification / release note publish の状態が分離されていない。
2. environment parity / secrets drift / runtime drift を release 文脈で保存していない。
3. migration risk（destructive/irreversible 相当）の事前チェックと承認証跡が弱い。
4. support 向け要約と public release note の分離が運用ルールのみで、記録基盤が弱い。
5. release と incident の関連を追えるが、release 起点の判断画面が不足。

### 1-3. dangerous operation（要注意）
- FTP deploy 実行時に rollout と同時公開になりやすい。
- backend deploy と migration 実行の依存関係が明文化不足。
- freeze 中の hotfix 例外フローが runbook に分散。

## 2. 今回追加した情報設計

### 2-1. 追加した summary/state
`internal release dashboard` で以下を扱う。
- `releaseSummary`
- `deploymentSummary`
- `rolloutSummary`
- `rollbackSummary`
- `environmentParitySummary`
- `migrationSummary`
- `releaseNoteSummary`

### 2-2. 主要 state（責務分離）
- `releaseState`: planned / ready / blocked / releasing / partially_released / released / verified / rolled_back / canceled
- `deploymentState`: not_started / ready / running / completed / failed / rolled_back
- `rolloutState`: not_started / staged / partial / full / paused / completed / reverted
- `rollbackState`: not_needed / prepared / available / running / completed / failed
- `environmentParityState`: aligned / drift_detected / review_needed / blocked
- `migrationRiskState`: low / medium / high / destructive_like / irreversible_like
- `verificationState`, `smokeCheckState`, `healthCheckState`
- `freezeState`, `hotfixState`
- `releaseApprovalState`, `releaseCommunicationState`, `releaseVisibilityState`

> 方針: PR state と release state、deploy と rollout、rollback available と rollback executed を分離する。

## 3. 実装内容（コード）

### 3-1. backend（control plane）
- `/api/internal/releases/dashboard` を追加。
  - `internal_audit_log`（`ops-release:*`）から release summary を集計。
  - blocked changes / active rollouts / rollback-ready を抽出。
- `/api/internal/releases/action` を追加。
  - preview / parity_check / approve / execute / verify / rollback_execute / publish_note を記録。
  - preview/dry-run/confirm/reason/audit を必須化。
- 監査ログ metadata に release states と `nextRecommendedAction` を保持。

### 3-2. frontend（internal admin）
- Internal Admin に `release dashboard` セクションを追加。
  - summary-first（release / parity / migration / release notes）表示。
  - drilldown 用に blocked / active rollout / rollback-ready を表示。
- safe action 導線（parity check dry-run / staged rollout execute / rollback execute）を追加。
- release 関連 analytics event を追加。

### 3-3. permissions
- internal permission を細分化。
  - `internal.release.read`
  - `internal.release.approve`
  - `internal.release.execute`
  - `internal.release.rollback`
  - `internal.release.note.publish`
- reviewer/approver/executor/rollback executor の分離を permission で表現。

## 4. environment parity / migration safety 運用

### 4-1. parity / drift 観点
- presence mismatch（secret が無い）
- runtime mismatch（値不一致の疑い）
- drift_detected（既知 drift）

### 4-2. migration safety
- migration は有無だけでなく `migrationRiskState` を保持。
- `destructive_like` / `irreversible_like` は approve 前に review 必須。
- app release / DB migration / content release を別 state で管理。

## 5. release communication
- internal release note（詳細）
- support-facing summary（問い合わせ用）
- public release note（公開要約）

> internal detail を public へ直接出さない。incident notice と release note も分離する。

## 6. 接続方針（operations / incident / status / support）
- release dashboard は判断ハブ。
- incident dashboard は障害 triage ハブ。
- status page は public communication ハブ。
- support center は問い合わせ対応ハブ。

`nextRecommendedAction` と `sourceSite/sourceArea` を共通文脈として橋渡しする。

## 7. analytics / audit
追加イベント（frontend track と backend受信許可）:
- `release_dashboard_view`
- `release_summary_view`
- `parity_check_run`
- `parity_check_result_view`
- `migration_risk_view`
- `rollout_start` / `rollout_pause` / `rollout_resume` / `rollout_complete`
- `verification_start` / `verification_complete`
- `rollback_preview_view` / `rollback_execute_start` / `rollback_execute_complete`
- `hotfix_start`
- `freeze_exception_request`
- `release_note_publish`
- `related_incident_open`

## 8. env / GitHub Secrets / runtime 整理

### 8-1. backend runtime env（新規）
- `RELEASE_FREEZE_ENABLED`
- `RELEASE_FREEZE_CALENDAR`（JSON）
- `RELEASE_PARITY_STRICT_MODE`
- `RELEASE_PARITY_REQUIRED_ENVIRONMENTS`
- `RELEASE_MIGRATION_DESTRUCTIVE_REQUIRE_APPROVAL`
- `RELEASE_ROLLBACK_REQUIRE_APPROVAL`
- `RELEASE_VERIFICATION_REQUIRED`
- `RELEASE_PUBLIC_NOTE_REQUIRE_APPROVAL`
- `RELEASE_DIGEST_ENABLED`

### 8-2. GitHub 側責務
- runtime secret（backend実行時）と CI secret（workflow）を分離。
- staging / production の environment ごとに secrets/vars を分離。

## 9. freeze / hotfix ルール
1. freeze 中は通常 release execute を停止。
2. hotfix は `releaseWindowState=freeze_exception` と理由を必須記録。
3. rollback は hotfix 中でも最優先で実行可能にする。

## 10. 確認手順（最小）
1. release dashboard 更新 → parity/migration リスク確認。
2. parity check dry-run 実行。
3. approve 後に staged rollout execute。
4. verification checklist 完了。
5. 必要時 rollback execute。
6. support / status page / incident の communication を同期。

## 11. 残課題（次PR候補）
- progressive rollout / canary release の自動段階制御。
- automatic rollback recommendation。
- release calendar / freeze calendar UI。
- deploy digest 自動配信。
- parity check の実測（GitHub Secrets 差分API連携）自動化。

## 12. 仮定
- internal dashboard は既存 `internal-audit-log` を release control plane として拡張利用できる。
- GitHub environment の reviewer ルールは組織設定側で強制済み。
- Supabase Auth は全サイト共通 project を継続利用する。
