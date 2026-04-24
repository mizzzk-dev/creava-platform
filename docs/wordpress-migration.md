# Strapi → WordPress 移行計画（PR #231 次段 / 実運用化）

## 0. 今回の到達点
- PR #231 の基盤（provider 切替・WP ルート雛形・移行スクリプト骨組み）から、次段として **本番切替可能性を評価/実行できる状態** まで拡張。
- 重点は次の 6 分離：
  1. API parity
  2. migration execution
  3. parity verification / diff audit
  4. Stripe / webhook correctness
  5. membership / gated access
  6. staged cutover / rollback readiness

---

## 1. PR #231 時点の切り分け

### 1-1. 本実装だった部分
- `frontend/src/lib/cms/*` に CMS Provider 層が存在し、`VITE_CMS_PROVIDER` で strapi/wordpress を切替可能。
- blog / news / events / works / store / fanclub / settings の frontend API は provider 経由化済み。
- CMS fetch で `response.ok / content-type / HTML 混入 / timeout / retry` のガードが追加済み。

### 1-2. 雛形 / TODO が残っていた部分
- WordPress content route は最低限の一覧返却のみで、locale / taxonomy / access / media parity が不足。
- Stripe route は `not_implemented`、webhook 署名検証も TODO。
- migration script はログ出力のみで、dry-run/verify/report/idempotent 実行は未完成。
- rollback 可能性を判断できる parity report・差分分類・手順 docs が不足。

---

## 2. 今回の実装概要

### 2-1. WordPress content API の本実装化
- `wp-json/creava/v1/{blog,news,events,works,store-products,fanclub-contents}` で次をサポート：
  - `page/pageSize`, `sort`, `slug`, `locale`, `accessStatus`, taxonomy フィルタ
  - Strapi 互換の `data + meta.pagination` 形式
  - `accessStatus` と entitlement による本文出し分け
  - thumbnail / taxonomy / SEO meta の正規化
- trace 情報（`wordpressTraceId`, `wordpressVerifiedAt` など）を `meta.trace` へ格納し監査可能化。

### 2-2. migration execution 基盤
- `scripts/migrate-strapi-to-wordpress.ts` を実行可能化。
  - `--dry-run`
  - `--verify-only`
  - `--type=<content-type>`
  - `--locale=<locale>`
  - `--limit=<n>`
  - report 出力（`scripts/migration/reports/*.json`）
- `mapping.json` を idempotent に upsert 更新。
- WordPress 側に `/wp-json/creava/v1/migration/*` upsert route を実装。

### 2-3. parity verification / diff audit
- migration 処理内で Strapi source と WordPress target の差分比較を実施。
- mismatch は `slug / locale / accessStatus / missing_target` で分類。
- report に `ok/ng` と mismatches を残し、cutover 判定の材料を提供。

### 2-4. Stripe / membership 実装
- checkout / portal を Stripe API 実行に接続（WordPress から安全側 proxy）。
- webhook で以下を実装：
  - `stripe-signature` 検証（timestamp tolerance + HMAC）
  - duplicate event ガード
  - allowlist 相当のイベント処理（checkout completed / subscription created,updated,deleted）
  - order / subscription / entitlement 同期
- entitlement を access control に接続し、member-only の本文漏えいを防止。

### 2-5. staged cutover
- frontend で endpoint 単位の provider 判定を追加。
- `VITE_CMS_PROVIDER=wordpress` のみでは全面切替しない構成へ変更。
- 次の段階フラグを追加：
  - `VITE_CMS_WORDPRESS_ROLLOUT_ENABLED`
  - `VITE_CMS_WORDPRESS_ROLLOUT_SITE_{MAIN,STORE,FC}`
  - `VITE_CMS_WORDPRESS_ROLLOUT_{BLOG,NEWS,EVENTS,WORKS,STORE,FANCLUB,SETTINGS}`

---

## 3. 実行手順

### 3-1. Dry run
```bash
STRAPI_MIGRATION_SOURCE_URL=... \
STRAPI_MIGRATION_SOURCE_TOKEN=... \
WORDPRESS_MIGRATION_TARGET_URL=... \
WORDPRESS_MIGRATION_APP_TOKEN=... \
node --loader ts-node/esm scripts/migrate-strapi-to-wordpress.ts --dry-run
```

### 3-2. Verify only
```bash
node --loader ts-node/esm scripts/migrate-strapi-to-wordpress.ts --verify-only --type=blog-posts
```

### 3-3. 実行
```bash
node --loader ts-node/esm scripts/migrate-strapi-to-wordpress.ts --type=store-products --locale=ja
```

---

## 4. Cutover / Rollback ルール

### Cutover 前チェック
- 各 content type で verify `ng = 0` または許容理由が明文化されている
- checkout / portal / webhook の疎通と再送耐性を確認済み
- member-only コンテンツを未ログインで本文取得できないことを確認
- main/store/fc 別にフラグで有効化可能であることを確認

### Rollback
- rollout flag を単位別（site or content type）で `false`
- `VITE_CMS_PROVIDER=strapi` へ戻す
- webhook は継続受信しつつ、front の provider のみ先に rollback 可能
- rollback 後に verify-only 実行で差分が再現性あることを確認

---

## 5. Secrets / Env

### Frontend
- `VITE_WORDPRESS_API_URL`
- `VITE_CMS_WORDPRESS_ROLLOUT_*`
- （継続）`VITE_CMS_PROVIDER`

### Runtime (WordPress)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`
- `STRIPE_PORTAL_RETURN_URL`
- `WORDPRESS_MIGRATION_APP_TOKEN`

### Migration 実行時
- `STRAPI_MIGRATION_SOURCE_URL`
- `STRAPI_MIGRATION_SOURCE_TOKEN`
- `WORDPRESS_MIGRATION_TARGET_URL`
- `WORDPRESS_MIGRATION_APP_TOKEN`

---

## 6. 残課題（次PR候補）
- WordPress editor workflow（revision/approval/preview）最適化
- media governance（image variants, CDN cache, alt policy）
- search parity / preview parity の追加検証
- Strapi full decommission 計画

---

## 7. 仮定
- WordPress runtime は HTTPS + app token 配布で migration route を保護できる。
- Stripe は WordPress 直 SDK ではなく API proxy 方式でも運用要件を満たす。
- locale は現状 `ja` 優先で、`en/ko` は同一方式で段階追加可能。
