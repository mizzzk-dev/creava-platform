# Strapi → WordPress 移行計画（full migration execution / staged cutover / decommission readiness）

## 0. このPRで進めた範囲
- migration script を **dry-run / verify-only / actual-run** の明示モードに分離し、report に execution state / trace / rollback state を出力。
- frontend discovery 検索を provider 対応にし、WordPress API (`/discovery/search`) 経由でも既存 `DiscoverySearchResponse` shape を返せるようにした。
- WordPress plugin に preview verify endpoint (`/preview/verify`) と discovery search endpoint (`/discovery/search`) を追加。
- staged cutover 対応として `VITE_CMS_WORDPRESS_ROLLOUT_DISCOVERY_SEARCH` を追加し、route単位で Strapi fallback 可能化。
- docs/runbook に migration execution / cutover / rollback / decommission readiness checklist を追記。

---

## 1. 現在 still Strapi-dependent な部分
1. webhook起点の publish/revalidation 本体は Strapi backend (`/api/cms-sync/*`) が主系。
2. preview verify の既定値は依然として Strapi endpoint を参照（WordPress endpoint は opt-in）。
3. discovery 以外の検索系（support FAQ/guide 内部検索）は Strapi/Supabase依存が残る。
4. editor運用（revision/approval/dashboard）は Strapi/既存runbook中心。
5. analytics event の一部に Strapi運用用 action 名が残る。

## 2. 現在 WordPress で置き換え可能な部分
1. blog/news/events/works/store/fanclub/settings の content fetch。
2. Stripe checkout / portal / webhook の WordPress headless auth 経路（前段対応）。
3. discovery 検索導線（route rollout で WordPress 化可能）。
4. preview verify endpoint（WordPress secret運用に切替可能）。
5. migration upsert route + verify/diff report。

## 3. readiness gap（不足）
### migration execution readiness
- 実データでの media relation 完全一致監査と resume strategy の自動化は次段で継続。

### preview parity readiness
- preview token lifecycle（TTL/revoke/audit）は未実装。

### search parity readiness
- relevance tuning（重み付け、同義語、N-gram）は最小。

### staged cutover readiness
- discovery以外の route-level override は env flag 運用中心で、管理UIは未導入。

### decommission readiness
- Strapi shutdown 前の最終「ゼロ依存」監査ジョブは未導入。

---

## 4. migration execution / verify-only / actual-run 方針
- `--dry-run`: writeなしで migration report + diff report を出力。
- `--verify-only`: 移行実行せず parity 検証のみ。
- `--actual-run`: WordPress upsert を実行。
- `--resume-failed-only`: mapping 上 failed のみ再実行。
- report には以下を必須出力。
  - `migrationExecutionState`
  - `migrationDryRunState`
  - `migrationVerifyState`
  - `migrationReportState`
  - `migrationDiffState`
  - `migrationIdempotencyState`
  - `migrationRollbackState`
  - `migrationTraceId`
  - `migrationStartedAt / migrationCompletedAt / migrationVerifiedAt`

---

## 5. preview parity 方針
- preview state を `cms_preview_state` に統一し provider (`strapi|wordpress`) を保持。
- verify endpoint は provider 別に切替。
  - Strapi: `VITE_PREVIEW_VERIFY_ENDPOINT`
  - WordPress: `VITE_WORDPRESS_PREVIEW_VERIFY_ENDPOINT`
- `provider` query がない場合は `VITE_CMS_PROVIDER` から既定決定。
- fallback secret は互換用で、基本は backend verify を推奨。

---

## 6. search/list/taxonomy parity 方針
- WordPress discovery route で以下を満たす。
  - locale/sourceSite/contentType/category/memberState/sort/limit のクエリ受け取り
  - `DiscoverySearchResponse` contract 準拠
  - guest は `accessStatus != public` を除外
  - taxonomy から category/tags を抽出して facet 生成
- no-result 時の fallback recommendations を返す。

---

## 7. staged cutover / rollback 方針
- provider 共通条件
  - `VITE_CMS_PROVIDER=wordpress`
  - `VITE_CMS_WORDPRESS_ROLLOUT_ENABLED=true`
  - `VITE_CMS_WORDPRESS_ROLLOUT_SITE_{MAIN|STORE|FC}=true`
- route別条件
  - content routes: `VITE_CMS_WORDPRESS_ROLLOUT_{BLOG|NEWS|EVENTS|WORKS|STORE|FANCLUB|SETTINGS}`
  - discovery: `VITE_CMS_WORDPRESS_ROLLOUT_DISCOVERY_SEARCH`
- rollback は route flag だけ戻せる構造を維持。

### rollback criteria
- verify mismatch が `critical > 0` or `high > 0` なら rollback 推奨。

---

## 8. Strapi decommission readiness checklist（現段）
- [ ] main/store/fc の主要 route が WordPress provider で 7日安定
- [ ] preview verify が WordPress endpoint 主系化
- [ ] discovery/search parity 検証が定常運用化
- [ ] publish/revalidate/cdn purge が WordPress起点で監視可能
- [ ] Stripe checkout/portal/webhook のエラーレートが基準値内
- [ ] fallback/rollback drill を staging で月次実施
- [ ] unresolved Strapi dependency 一覧がゼロ

---

## 9. GitHub Secrets / runtime env
### Frontend
- `VITE_CMS_PROVIDER`
- `VITE_WORDPRESS_API_URL`
- `VITE_CMS_WORDPRESS_ROLLOUT_*`
- `VITE_PREVIEW_VERIFY_ENDPOINT`
- `VITE_WORDPRESS_PREVIEW_VERIFY_ENDPOINT`

### WordPress runtime
- `WORDPRESS_MIGRATION_APP_TOKEN`
- `WORDPRESS_PREVIEW_SECRET`（または `PREVIEW_SHARED_SECRET`）
- `WORDPRESS_HEADLESS_JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Migration実行
- `STRAPI_MIGRATION_SOURCE_URL`
- `STRAPI_MIGRATION_SOURCE_TOKEN`
- `WORDPRESS_MIGRATION_TARGET_URL`
- `WORDPRESS_MIGRATION_APP_TOKEN`

---

## 10. 仮定
1. WordPress REST は WAF/CDN 経由でも `content-type: application/json` を安定返却できる。
2. discovery の relevance は当面「新着優先 + キーワード一致」で運用許容。
3. preview secret は短期ローテーション運用を別runbookで実施する。
4. Strapi shutdown はこのPRでは実施せず、parallel運用を継続する。
