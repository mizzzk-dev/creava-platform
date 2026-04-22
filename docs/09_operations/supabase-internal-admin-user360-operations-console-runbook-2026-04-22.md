# Supabase Auth 前提 internal admin / operations console / user 360 runbook（2026-04-22）

## 1. 現在の internal admin / support 運用課題
1. user lookup は email 中心で、authUserId / supabaseUserId / appUserId 起点の調査が運用者依存になりやすい。
2. user summary は存在するが、membership / support / security / audit の根拠を同一タイムラインで追いづらい。
3. safe operation と privileged action の境界が UI 上で明確でなく、読み取り中心運用へ寄せる余地があった。
4. investigation 状態と user-facing 状態を混同しやすく、問い合わせ一次切り分けが属人化しやすい。

## 2. 情報設計（user 360 / operations / investigation）
- `user360Summary`:
  - sourceOfTruth は app user domain。
  - `membershipStatus` / `entitlementState` / `subscriptionState` / `billingState` / `lifecycleStage` を横並びで提示。
  - `dataConfidenceState` を導入し stale/mismatch の検知余地を確保。
- `operationsSummary`:
  - `safeOperations` と `privilegedActions` を分離。
  - `privilegedActionState` / `privilegedActionApprovalState` / `operationResultState` を UI 側で明示。
- `investigationSummary`:
  - `investigationState` / `investigationReason` / `followupState` を user-facing 状態と分離。
- `auditSummary`:
  - privileged action の成功/失敗/拒否を集約。
- `timeline`:
  - membership・support・security event・security notice・investigation・internal audit を統合表示。

## 3. internal admin 基盤整備
- lookup API を `q` 対応（email / authUserId / supabaseUserId / logtoUserId / appUserId）。
- internal admin UI を read-heavy 前提に整理。
- support/internal role でも閲覧可能（危険操作は permission 判定で backend 強制）。

## 4. user summary / timeline / linked context
- 既存 `userSummary` に加え `user360Summary`, `timeline`, `investigationSummary`, `auditSummary` を追加。
- timeline は `timelineEventType`, `timelineEventSeverity`, `timelineEventSource`, `sourceSite` を保持。
- support case / security notice / investigation / privileged action の根拠を1画面で追跡可能化。

## 5. safe operations / privileged actions
- safe operations:
  - summary refresh
  - notification preference reset
  - support follow-up create（将来実装余地）
- privileged actions:
  - account status update
  - session revoke support（将来実装余地）
- UI で理由入力必須、backend では既存 internal permission + audit 記録で強制。

## 6. support / internal admin 調査導線
- lookup → user360 → timeline を最短導線化。
- explanation block で「何を見るべきか」を明示。
- user-facing summary（mypage）と internal summary（internal admin）を責務分離。

## 7. RLS / access / admin policy
- Supabase Auth は認証 SoT、business state は app user domain SoT。
- internal admin の更新系は backend endpoint 経由のみ。
- role/permission 境界:
  - `internal.user.read`: lookup / summary / timeline
  - `internal.notification.reset`: 通知設定リセット
  - `internal.account.status.update`: account status 更新
  - `internal.audit.read`: 監査参照
- frontend 表示可否と backend 強制可否を分離し、UI 制御のみで危険操作を許可しない。

## 8. analytics / audit / runbook 接続
- internal admin で以下イベントを計測:
  - `user_lookup_start`
  - `user_lookup_result_view`
  - `user360_summary_view`
  - `timeline_view`
  - `privileged_action_start`
  - `privileged_action_complete`
- privileged action は既存 internal audit log に記録し続ける。

## 9. env / GitHub Secrets / runtime
- frontend `.env.example`
  - `VITE_INTERNAL_ADMIN_CONSOLE_ENABLED`
  - `VITE_INTERNAL_ADMIN_USER360_TIMELINE_LIMIT`
- backend `.env.example`
  - `INTERNAL_ADMIN_APPROVAL_REQUIRED_ACTIONS`
  - `INTERNAL_ADMIN_APPROVAL_MIN_ROLE`
  - `INTERNAL_ADMIN_USER360_TIMELINE_LIMIT`
  - `INTERNAL_ADMIN_AUDIT_RETENTION_DAYS`
- GitHub Secrets では `SUPABASE_SERVICE_ROLE_KEY` を backend runtime のみに設定し、frontend へ露出しない。

## 10. local / staging / production 確認手順
1. support/admin role でログインし `/internal` を開く。
2. email または authUserId で lookup。
3. user360 summary の membership / entitlement / billing / investigation を確認。
4. timeline で security/support/audit 根拠を確認。
5. privileged action は理由未入力で実行不可、理由入力時は backend audit に記録されることを確認。

## 11. よくあるトラブル
- lookup で見つからない:
  - `q` が email か userId かを確認。
  - app-user の `authUserId/supabaseUserId/logtoUserId` 同期状態を確認。
- timeline が薄い:
  - security event / inquiry / audit log の発火有無を確認。
- 操作が 403:
  - role claim に必要 internal permission がない。

## 12. 仮定
1. internal role claim は既存トークンに含まれる。
2. approval workflow の多段承認は次PRで実装する。
3. session revoke 実処理は既存 security hub 実装と連携する前提で、今回は運用導線定義まで。
