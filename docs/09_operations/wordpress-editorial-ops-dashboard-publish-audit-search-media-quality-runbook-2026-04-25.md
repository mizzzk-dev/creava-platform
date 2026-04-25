# WordPress editor dashboard parity / publish audit / search diagnostics / media dedupe / content quality runbook（2026-04-25）

## 0. このPRの目的（次段）
前段の production hardening（security / backup / restore / observability / DR）で「守れる」状態にした上で、今回は **編集者と運用者が daily operation で迷わず判断・修正・公開できる状態** を作る。

---

## 1. 現在の WordPress daily operation のボトルネック（棚卸し）

1. **queue と readiness が分離されていない**
   - draft/pending/publish の状態は見えるが、`locale/SEO/media/access/dependency` で何が blocker か判定しづらい。
2. **publish audit が散在**
   - publish / preview / revalidation / cache invalidation を1つの操作履歴として追跡しづらい。
3. **search diagnostics が弱い**
   - 検索結果の有無は見えるが、`zero-result / low-click / locale mismatch` の改善キュー化が弱い。
4. **media dedupe が運用判断に落ちていない**
   - 重複候補と safe-to-delete が混ざりやすく、誤削除リスクがある。
5. **content quality が routine 化されていない**
   - pre-publish / post-publish / weekly / monthly で見るべき観点が分離されていない。

---

## 2. 今回の実装範囲（責務分離）

### 2-1. editor dashboard / ops queue / quality state
- `creava/v1/ops/editorial-dashboard` を追加。
- `editorialOpsState / editorialQueueState / publishReadinessState / operatorActionState / opsPriorityState / opsTraceId / opsUpdatedAt` を返す。
- queue と readiness を分離し、**「次に何を直すか」** を `nextRecommendedAction` で提示。

### 2-2. publish audit UI / dependency visibility
- post status 遷移時に `creava_publish_audit_log` へ監査ログを保存。
- `who/what/when/where` と preview/live link、revalidation/cache 状態（queued/not_required）を記録。
- `creava/v1/ops/publish-audit` で参照可能。

### 2-3. search relevance tuning / diagnostics
- discovery search 実行時に query diagnostics を記録（result count + quality state）。
- `creava/v1/ops/search-diagnostics` で no-result / low-click risk / locale mismatch risk の集計を表示。
- tuning は explainable ルール（locale boost / private content guard）として出力。

### 2-4. media governance / asset dedupe（安全運用）
- `creava/v1/ops/asset-health` で duplicate candidate / orphan candidate / metadata incomplete を分離。
- hash（`_creava_file_hash`）ベースの candidate 化、canonical 候補を提示。
- destructive default を無効化し、safe merge/delete は `manual_review_required` 前提。

### 2-5. content quality operations
- `creava/v1/ops/content-quality` で `locale/SEO/media/dependency/stale/search/asset` の状態を統合。
- pre/post publish checklist、weekly/monthly review focus を返却。

---

## 3. WordPress admin UI（editorial actionability）
- 管理画面に `Editorial Ops` メニューを追加。
- 同一画面で以下を表示:
  1. Editorial Queue / Publish Readiness
  2. Publish Audit
  3. Search Diagnostics
  4. Asset Deduplication / Governance
  5. Content Quality Ops
- 明示ルール: **queue で作業優先度、audit で原因追跡、quality で公開前後確認**。

---

## 4. API一覧（今回追加）

- `GET /wp-json/creava/v1/ops/editorial-dashboard`
- `GET /wp-json/creava/v1/ops/publish-audit`
- `GET /wp-json/creava/v1/ops/search-diagnostics`
- `GET /wp-json/creava/v1/ops/asset-health`
- `GET /wp-json/creava/v1/ops/content-quality`

> いずれも `edit_posts` 権限ユーザー、または `WORDPRESS_EDITORIAL_OPS_TOKEN` を `x-creava-ops-token` で付与したアクセスのみ許可。

---

## 5. env / runtime / secrets 整理

### 5-1. WordPress runtime env（server only）
- `WORDPRESS_EDITORIAL_OPS_TOKEN`（外部 ops viewer 用、frontend 露出禁止）
- `CREAVA_EDITORIAL_AUDIT_LOG_LIMIT`（監査ログ保存件数）
- `CREAVA_SEARCH_DIAGNOSTICS_LIMIT`（search diagnostics 保存件数）

### 5-2. Frontend env（公開値のみ）
- `VITE_WORDPRESS_EDITORIAL_OPS_TIMEOUT_MS`
  - WordPress ops endpoint 取得の timeout（内部利用モジュール）

---

## 6. daily operation 手順

### 6-1. 毎日（editor / reviewer / publisher）
1. `Editorial Ops` を開く。
2. `high priority count` と `nextRecommendedAction` を確認。
3. `failed_publish_queue` → `locale_incomplete_queue` → `seo_incomplete_queue` → `media_incomplete_queue` の順に処理。
4. Publish後は `Publish Audit` で trace を確認。
5. Search変更後は `Search Diagnostics` の no-result 推移を確認。

### 6-2. 週次（operator）
- `zero_result_query_top20` と `duplicate_asset_candidates` をレビュー。
- stale content queue を編集計画へ移動。

### 6-3. 月次（admin）
- locale coverage、SEO completeness、orphan asset cleanup 候補を棚卸し。
- dedupe 実施時は backup snapshot 取得済みを確認してから手動承認。

---

## 7. ownership / review cadence
- dashboard owner: `editorial-ops`（publisher lead）
- publish audit owner: `release-ops`（operator）
- search diagnostics owner: `search/content`（editor + analyst）
- asset health owner: `media governance`（operator）
- quality review owner: `content quality guild`（editor/reviewer/admin）

---

## 8. よくあるトラブル
1. `forbidden`
   - WPログイン権限（`edit_posts`）または `WORDPRESS_EDITORIAL_OPS_TOKEN` を確認。
2. search diagnostics が空
   - discovery search 実行数が不足している可能性。
3. duplicate candidate が多すぎる
   - hash 算出対象が増えた直後は候補が急増する。safe merge 前に usage relation を必ず確認。
4. publish audit の失敗件数が増える
   - readiness blocker（locale/seo/media/access）を先に解消。

---

## 9. すぐやるべき整理（今回）
1. queue/readiness/action を分離して見える化
2. publish trace の単一画面化
3. no-result と low-click の分離観測
4. duplicate candidate と safe-to-delete の分離
5. pre/post publish checklist の運用導線化

## 10. 恒久対応の実装順（次PR以降）
1. search click feedback を保存し ranking rule を自動提案
2. dependency graph（taxonomy/featured/navigation）の可視化
3. dedupe auto-merge assist（still manual approval）
4. editorial SLA dashboard（role別）
5. cross-site content dependency graph

---

## 11. 仮定（このPRで補完した点）
1. locale は `post_meta(locale)` がある場合はそれを採用し、未設定は WordPress locale を使用。
2. revalidation / cache invalidation の実行そのものは既存運用系に依存し、本PRでは audit 上の queue state を可視化。
3. search click ログ基盤が未整備のため、low-click risk は結果件数近似で暫定判定。
4. asset dedupe は hash/usage ベースの候補提示までで、削除・統合は手動承認前提。
5. dependency health は taxonomy/featured/navigation の完全グラフ化を次段とし、今回は可視化フラグで運用開始。
