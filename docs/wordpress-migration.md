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

### 1-2. PR #231 review で残っていた blocker
- WordPress content payload に `limitedEndAt` / `archiveVisibleForFC` の扱い揺れがあり、limited-window の表示制御が frontend semantics とズレるリスク。
- list endpoint の `pageSize` fallback が不安定で、`meta.pagination` が欠落時に 1 件固定化へ寄るリスク。
- `/billing/portal` が cookie login 前提 permission で、headless frontend の bearer/JWT auth と不整合。
- migration verify report に severity / rollback 判定が不足し、staged cutover の可否判断が曖昧。

---

## 2. 今回の実装概要

### 2-1. WordPress content API parity hardening
- `accessStatus` を `public / fc_only / limited` に正規化し、`members_only` 互換値も吸収。
- payload に `limitedEndAt` / `archiveVisibleForFC` / `wordpressLimitedWindowState` / `wordpressArchiveVisibilityState` を含め、frontend `canViewContent` 判定に必要な意味を保持。
- `limitedEndAt` は malformed/null を吸収して ISO8601 に正規化（invalid は null 扱い）。
- `creava_can_view_post()` を limited-window semantics に合わせ、**期限内 limited は guest 可 / 期限後は archiveVisibleForFC + member entitlement で制御** に統一。
- trace 情報に `wordpressCompatibilityState` を追加し、route 単位の監査を容易化。

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
- migration verify で mismatch を `slug / locale / accessStatus / missing_target` で分類。
- さらに severity を `critical / high / medium` に分類し、report に `rollbackReadiness` を出力。
- `critical` または `high` が 1 件でも残る場合は staged cutover を進めない最小基準を明文化。

### 2-4. Stripe / membership auth parity hardening
- `/billing/portal` の permission を cookie login 依存から、**headless bearer/JWT 検証 + user resolve** へ変更。
- JWT claim (`wpUserId` / `sub` / `email`) から user を解決し、`stripe_customer_id` がない場合は `customer_not_found` を返して unauthorized と分離。
- unauthorized / missing customer / Stripe API エラーで失敗 shape を分離し、`wordpressTraceId` を返して追跡可能化。
- checkout / portal の auth semantics をそろえ、frontend token 送信方式と整合。

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
- `WORDPRESS_HEADLESS_JWT_SECRET`（billing portal bearer/JWT 検証用。frontend へ露出禁止）

### Migration 実行時
- `STRAPI_MIGRATION_SOURCE_URL`
- `STRAPI_MIGRATION_SOURCE_TOKEN`
- `WORDPRESS_MIGRATION_TARGET_URL`
- `WORDPRESS_MIGRATION_APP_TOKEN`
- `WORDPRESS_HEADLESS_JWT_SECRET`（billing portal bearer/JWT 検証用。frontend へ露出禁止）

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
