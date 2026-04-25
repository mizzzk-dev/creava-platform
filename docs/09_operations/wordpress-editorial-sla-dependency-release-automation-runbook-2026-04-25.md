# WordPress editorial SLA dashboard / dependency graph / release calendar / workflow automation / workload balancing runbook（2026-04-25）

## 0. 目的と今回の改善範囲
このPRでは、前段で整備した editor dashboard / publish audit / search diagnostics / media governance / content quality operations を土台に、
**「見える状態」から「誰が・いつ・何を・どの依存関係で・どの期限までに処理するかを回せる状態」** へ進める。

対象:
- `mizzz.jp`（main）
- `store.mizzz.jp`（store）
- `fc.mizzz.jp`（fanclub）

共通運用基盤として、次を分離して実装・運用する:
- `editorialSlaState`
- `dependencyGraphState`
- `releaseCalendarState`
- `workflowAutomationState`
- `operatorLoadState`
- `escalationState`
- `publishRiskState`
- `queuePriorityState`

---

## 1. 現在の WordPress daily operation の詰まり（棚卸し）

1. **queue と行動優先度が混線**
   - queue は見えるが、SLA / リスク / 期限 / blocked を分けて判断しづらい。
2. **依存関係が個人の頭の中に残る**
   - taxonomy・featured・membership・asset・locale の影響範囲が公開前に統合表示されない。
3. **release 計画が単発作業化しやすい**
   - calendar と publish queue の責務分離が弱く、公開後 verification が漏れやすい。
4. **workflow automation が通知止まりになりやすい**
   - reminder / escalation / assignment assist が一体化され、noisy になりやすい。
5. **負荷分散が感覚運用に寄りやすい**
   - owner 別の overloaded / underutilized / blocked が可視化されにくい。

---

## 2. 設計方針（責務分離）

### 2-1. editorial SLA / queue priority / workload
- SLA と priority を混同しない。
- `overdueState` と `blockedState` を別管理する。
- `operatorLoadState` を owner 単位で算出する。

採用 state:
- `editorialSlaState`: `on_track | at_risk | overdue | blocked | waiting_review | waiting_dependency | waiting_publish_window`
- `queuePriorityState`: `critical | high | medium | low | deferred`
- `operatorLoadState`: `balanced | overloaded | underutilized | blocked_by_dependency`
- `releaseRiskState`: `healthy | dependency_risk | locale_risk | seo_risk | membership_risk | cache_risk | needs_manual_check`
- `escalationState`: `none | reminder_sent | escalated_to_reviewer | escalated_to_publisher | escalated_to_admin | suppressed`

### 2-2. dependency graph / impact visibility
- content → taxonomy / asset / membership / related content の依存を edge 化する。
- publish risk / locale impact / revalidation scope を graph payload に含める。
- relation 表示だけでなく、`impactSummary` で運用判断に必要な件数を返す。

### 2-3. release calendar / publish queue
- calendar は「公開計画の時系列整理」。
- queue は「実務優先度・期限・risk・assignee の処理順」。
- publish 前 final check / publish 後 verification を checklist 化する。

### 2-4. workflow automation / reminder / escalation
- destructive default を禁止し、`suggestion_only` を既定にする。
- reminder と escalation を分離して集計する。
- mute / snooze 余地を payload に持たせる。

### 2-5. workload balancing / review cadence
- owner 別 load と queue backlog を同時に観測する。
- weekly / monthly の reporting state を分離する。
- throughput / review latency / fix latency を KPI として保持する。

---

## 3. 追加 API（WordPress plugin: `creava-platform-core`）

- `GET /wp-json/creava/v1/ops/dependency-graph`
- `GET /wp-json/creava/v1/ops/release-calendar`
- `GET /wp-json/creava/v1/ops/workflow-automation`
- `GET /wp-json/creava/v1/ops/workload-balancing`

既存 API 拡張:
- `GET /wp-json/creava/v1/ops/editorial-dashboard`
  - `editorialSlaState / queuePriorityState / operatorLoadState / reviewCadenceState / publishRiskState / releaseRiskState / dependencyImpactState / escalationState / reminderState / overdueState / blockedState` を追加。

アクセス制御:
- `edit_posts` 権限ユーザー
- または `x-creava-ops-token: WORDPRESS_EDITORIAL_OPS_TOKEN`

---

## 4. daily operation 手順

### 4-1. 毎日（editor / reviewer / publisher / operator）
1. `editorial-dashboard` を開く。
2. `queuePriorityState.critical` と `editorialSlaState.overdue` を先に確認。
3. `blockedState` と `dependencyImpactState.highSeverityCount` を確認し、依存解消を先行。
4. `release-calendar` の publish queue で assignee / deadline / risk を再確認。
5. `workflow-automation` の reminder/escalation を必要最小限で実行。
6. publish 後に verification checklist（preview diff / revalidation / cache / search）を必ず実施。

### 4-2. 週次（ops review）
- `workload-balancing` の `overloadedCount` をゼロに近づける。
- `reviewLatencyRisk` と `fixLatencyRisk` の改善施策を決める。
- locale backlog / dependency backlog を次週計画へ移す。

### 4-3. 月次（editorial governance）
- releaseRisk の内訳推移を確認。
- membership / locale / SEO の recurring block を runbook へ反映。
- escalation ルールの noisy 判定を見直す。

---

## 5. env / secrets / runtime

### 5-1. server-only（WordPress）
- `WORDPRESS_EDITORIAL_OPS_TOKEN`
- `CREAVA_EDITORIAL_AUDIT_LOG_LIMIT`
- `CREAVA_SEARCH_DIAGNOSTICS_LIMIT`
- `CREAVA_EDITORIAL_SLA_OVERDUE_HOURS`（任意）
- `CREAVA_EDITORIAL_ESCALATION_GRACE_MINUTES`（任意）
- `CREAVA_EDITORIAL_WORKLOAD_OVERLOAD_THRESHOLD`（任意）

### 5-2. frontend（public）
- `VITE_WORDPRESS_EDITORIAL_OPS_TIMEOUT_MS`

注意:
- JWT secret / webhook secret / WordPress 管理情報を frontend へ露出しない。

---

## 6. ownership / cadence

- dashboard owner: `editorial-ops lead`
- dependency owner: `content architecture owner`
- release calendar owner: `publisher on-duty`
- automation owner: `ops automation owner`
- workload owner: `operator manager`

review cadence:
- daily triage: 平日毎日
- weekly ops review: 週1
- monthly governance: 月1

---

## 7. よくあるトラブル

1. `403 forbidden`
   - `edit_posts` 権限または `WORDPRESS_EDITORIAL_OPS_TOKEN` を確認。
2. dependency graph が少ない
   - taxonomy / featured_content_ids / access_status のメタ有無を確認。
3. reminder が多すぎる
   - escalation grace / overdue threshold / suppression ルールを調整。
4. overloaded owner が固定化
   - assignment assist を reviewer/publisher の空きスロットへ再配分。
5. release queue が stale
   - dueAt 未設定アイテムの期日補完を先に行う。

---

## 8. 今回のPRでの改善点（要約）

1. SLA/priority/blocked/overdue/workload を分離。
2. dependency graph を cross-site 影響判断に使える粒度に拡張。
3. release calendar と publish queue を役割分離。
4. reminder/escalation/assignment assist を guarded automation で実装。
5. workload balancing と weekly/monthly reporting 入口を追加。

---

## 9. 仮定

1. locale は post meta `locale` 優先、未設定時は WordPress locale を利用。
2. revalidation/cache invalidation 実行処理は既存運用基盤が担い、本PRは scope/queue 可視化を担当。
3. dependency は taxonomy / featured_content_ids / thumbnail / access_status を一次ソースとし、navigation 固有依存は次段で拡張。
4. assignment assist は suggestion-only を既定とし、自動 assign は行わない。
5. publish queue の deadline は `editorial_due_at` / `release_due_at` / `publish_deadline` / `post_date_gmt` の順で推定。
