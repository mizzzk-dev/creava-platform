# workflow-playbook-automation-foundation (2026-04-19)

## 0. 目的
main / store / fc 横断で、alert を見て手動で動く運用から、**trigger → rule/condition → action → approval → audit/retry** を分離した自動化基盤へ進める。

## 1. 現在の運用自動化課題（調査結果）
1. alert / anomaly は internal BI で可視化されるが、実行導線は runbook 依存で属人化しやすい。
2. CRM / support / billing の対応が「ダッシュボード確認→別ツールで起票/配信」に分断され、初動遅延が発生しやすい。
3. failed payment / refund spike / support surge は検知できても、approval と実行履歴が同一画面で追えない。
4. replay/retry は個別 API ごとに運用され、横断ワークフローとしての dead-letter 相当の整理が弱い。

## 2. 人手依存が大きいフロー
- KPI悪化検知後の起票（growth/support/finance）
- failed payment 急増時の recovery message 設計と承認
- support急増時の FAQ/Guide 更新タスク化
- campaign CTR 低下時の template 切替判断
- refund spike 時の campaign pause / finance review

## 3. 自動化と approval 境界
### safe action（自動実行または提案）
- internal task 作成
- dashboard pin / anomaly highlight
- FAQ/Guide 更新候補の起票
- routing 強化提案

### dangerous action（approval 必須）
- billing/refund に影響する操作
- campaign 停止や公開状態変更
- 大規模 audience へのメッセージ送信
- entitlement override / destructive sync

## 4. trigger source と action target 候補
- trigger source: `kpi_alert`, `anomaly_detection`, `billing_event`, `order_refund_event`, `support_case_surge`, `crm_campaign_degradation`, `manual_operator_trigger`
- action target: internal task / review queue / CRM suggestion / finance review queue / FAQ update queue

## 5. main / store / fc 横断で効果が高い playbook 候補
- `billing-failed-payment-recovery`
- `support-surge-faq-guidance`
- `campaign-ctr-drop-review`
- `checkout-drop-growth-review`
- `refund-spike-finance-review`

## 6. workflow / playbook ドメイン整理
- workflow: `ops-automation-v1`
- playbook: 実務単位の運用テンプレート
- trigger/triggerSource: 検知イベント
- conditionSet/ruleEvaluation: 閾値・比較ロジック
- action/actionTarget/actionStatus: 実行対象と結果
- approvalStep/approvalStatus: dangerous action の承認
- executionRun/executionLog: 実行単位と履歴
- retryPolicy/failureReason: 再試行と失敗分類
- runMode: `manual/suggested/auto_safe/auto_with_approval/disabled`
- dryRun/safeMode/deduplication/cooldown/rateLimit: 安全制御

## 7. 今回の実装内容
### backend
- `GET /api/internal/automation/playbooks`
  - 14日 window を前半/後半で比較し playbook trigger を評価。
  - `pendingApprovals` を返却し、approval 待ちを明示。
- `GET /api/internal/automation/runs`
  - `internal-audit-log` の `targetType=playbook-execution` を実行履歴として返却。
- `POST /api/internal/automation/run`
  - dry-run / manual 実行を受け、approval 必須時は pending に遷移。
  - `internal-audit-log` に actor / runMode / idempotencyKey / rollbackHint を保存。

### frontend (internal admin)
- Playbook 一覧・実行履歴・dry-run/実行ボタンを追加。
- `pending approval` / `executionState` / `retryPolicy` の可視化を追加。

## 8. audit / retry / failure handling
- 監査は `internal-audit-log` に統一（`targetType: playbook-execution`）。
- retry は `maxAttempts` を playbook metadata に保持。
- dangerous action は `approvalStatus: pending` を返し、自動実行を抑制。
- deduplication は `idempotencyKey` を run metadata に記録。

## 9. env / docs / CI / Secrets 整理
### backend runtime env 追加
- `PLAYBOOK_APPROVAL_AUDIENCE_THRESHOLD`
- `PLAYBOOK_SAFE_MODE_DEFAULT`
- `PLAYBOOK_RETRY_LIMIT`

### GitHub Secrets / Variables
- 新規 Secret は必須追加なし（既存 internal auth / backend env を利用）。
- staging / production の backend env に上記 3 変数を追加推奨。

### DNS
- **DNS変更不要**（既存 `mizzz.jp` / `store.mizzz.jp` / `fc.mizzz.jp` と API ドメイン範囲内で完結）。

## 10. 実装順（今回）
1. 現状確認（docs, internal BI, internal admin, audit）
2. playbook domain を route/controller 型で追加
3. action/approval/safety guard を run API に実装
4. internal admin console に一覧/実行履歴/実行導線を追加
5. env/docs 更新

## 11. 残課題
- advanced orchestration（分岐/多段）
- queue 実体と dead-letter 専用ストレージ
- approval UI の role-based fine-grained 制御
- playbook 効果測定（成功率、MTTR改善）

## 12. 仮定
- 既存 KPI/anomaly データが継続投入されることを前提に trigger 評価している。
- approval ワークフローの最終承認 UI は次PRで拡張する前提。
- delivery-log の click 判定は `status=clicked` を含む運用前提。
