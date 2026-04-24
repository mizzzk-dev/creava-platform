# support policy governance / optimization audit / rollback / experiment guardrails / multilingual safety review runbook（2026-04-24）

## 1. 目的
- proactive / multilingual support optimization を **安全に変更・実験・監査・ロールバック** できる control plane を運用する。
- policy draft / review / approval / activation と experiment / guardrail / rollback / audit を混同しない。
- main / store / fc の user-facing 導線を壊さず、internal governance を共通運用する。

## 2. 現状課題（導入前の弱点）
1. policy 変更・実験・rollback が同じ「最適化状態」に埋もれ、責務分離が弱い。
2. multilingual safety の review queue が可視化されず、locale 劣化検知後の行動が遅い。
3. staged rollout と本番有効化の境界が曖昧で、監査理由の粒度が不足しやすい。
4. rollback readiness（準備済み）と rollback executed（実行済み）が同一扱いになりやすい。

## 3. state 定義（混同禁止）
- `policyState`: draft / under_review / approved / active / paused / deprecated / rolled_back
- `policyReviewState`: not_started / in_review / approved / rejected / changes_requested
- `policyApprovalState`: pending / approved / rejected / expired
- `experimentState`: none / draft / running / paused / completed / stopped / invalidated
- `experimentGuardrailState`: not_configured / healthy / warning / breached / auto_paused_like
- `multilingualSafetyState`: not_checked / safe / review_needed / blocked / degraded_like
- `rollbackState`: not_needed / prepared / recommended / running / completed / failed
- `auditState`: not_recorded / recorded / reviewed / anomaly_detected

## 4. 実装構成
### 4-1. frontend
- `frontend/src/modules/support/policyGovernance.ts`
  - governance state 型定義
  - support policy summary 生成
  - Contact handoff 連携用 query params 生成
- `frontend/src/pages/support/SupportCenterPage.tsx`
  - locale/retrieval/glossary 状態から governance summary を導出
  - 問い合わせ導線に governance query を引き継ぎ
- `frontend/src/pages/ContactPage.tsx` / `frontend/src/modules/contact/components/SupportAssistPanel.tsx`
  - governance state を prefill として受け取り、support 画面で確認可能化
- `frontend/src/pages/internal/InternalAdminPage.tsx`
  - policy registry / review queue / guardrail breach / rollback ready の dashboard
  - safe action（review / staged activation / rollback execute）導線

### 4-2. backend
- `GET /api/internal/support-policies/dashboard`
  - internal audit log（`ops-support-policy:*`）を source of truth として集計
  - review queue / guardrail breach / rollback ready / locale impact / risk summary を返却
- `POST /api/internal/support-policies/action`
  - draft / request_review / approve / activate / rollback_prepare / rollback_execute / audit_record を監査付きで記録
  - reason 必須、activate/rollback_execute は confirmed=true 必須
- `internal_audit_log` metadata に governance state を保持し、後続 analytics で利用

## 5. policy registry 運用手順
1. internal admin で `support policy summary 更新` を実行。
2. `reviewQueue` で `policyReviewState in (in_review, changes_requested)` を優先確認。
3. `guardrailBreaches` が 1 件以上なら staged activation を停止し rollback recommendation を確認。
4. locale impact が high/critical の場合、multilingual safety review を完了するまで active へ進めない。

## 6. staged rollout / rollback 手順
1. action: `request_review`（dry-run）で review queue へ投入。
2. safety check 通過後に action: `activate`（confirmed=true）で staged rollout。
3. guardrail breach / multilingual degraded が出たら action: `rollback_execute` を実行。
4. rollback 後は `auditState=recorded` と `policyLastRolledBackAt` を確認し、post-change learning を記録。

## 7. 監査・効果確認
- audit source: `internal_audit_log` (`ops-support-policy:*`)
- 監視すべき summary:
  - `guardrailSummary.breachedCount`
  - `multilingualSafetySummary.reviewNeededCount`
  - `rollbackSummary.recommendedCount`
  - `auditSummary.anomalyCount`
  - `localeImpactSummary.highCount + criticalCount`
- 効果確認時は「policy 変更した事実」と「問い合わせ品質改善」を分離して評価する。

## 8. runbook チェックリスト
1. policy registry に draft/under_review/active/rolled_back が区別表示される。
2. multilingual safety review queue と guardrail breach が抽出できる。
3. rollback prepared/recommended/completed が分離表示される。
4. Contact prefill に governance state が渡り、support 側で文脈確認できる。
5. internal note / unpublished article / secret が user-facing に露出しない。

## 9. GitHub Secrets / env
- frontend:
  - `VITE_SUPPORT_POLICY_GOVERNANCE_ENABLED`
  - `VITE_SUPPORT_GOVERNANCE_GUARDRAIL_WARN_THRESHOLD`
  - `VITE_SUPPORT_GOVERNANCE_GUARDRAIL_BREACH_THRESHOLD`
- backend:
  - `SUPPORT_POLICY_GOVERNANCE_ENABLED`
  - `SUPPORT_POLICY_GUARDRAIL_BREACH_THRESHOLD`
  - `SUPPORT_POLICY_GOVERNANCE_AUDIT_WINDOW_HOURS`

## 10. よくあるトラブル
- `support policy dashboard の権限がありません`
  - internal role に `internal.support.read` が付与されているか確認。
- `activate / rollback_execute は confirmed=true が必要です`
  - dangerous 操作は confirm 必須。UI で再実行時に confirmed を指定。
- `reason は8文字以上`
  - 監査品質維持のため reason を具体化して再実行。

## 11. 仮定
1. internal audit log は support governance の一次ストアとして継続利用する。
2. dedicated policy table は次段で追加し、今回は metadata 集計を優先する。
3. staged rollout の配信制御は既存 feature flag / policy engine と連携可能な前提。
