# WordPress staged cutover / rollback / decommission readiness runbook (2026-04-24)

## 1. 目的
main / store / fc を Strapi から WordPress へ段階移行する際に、
`migration execution` / `preview parity` / `search parity` / `rollback` / `decommission readiness` を分離して運用する。

## 2. 事前条件
- migration report の `critical=0` `high=0`。
- `VITE_CMS_PROVIDER=wordpress` でも global rollout はまだ無効。
- WordPress runtime secrets（preview/migration/stripe）が設定済み。

## 3. 手順
### 3-1. migration execution
1. dry run
```bash
node --loader ts-node/esm scripts/migrate-strapi-to-wordpress.ts --dry-run
```
2. verify-only
```bash
node --loader ts-node/esm scripts/migrate-strapi-to-wordpress.ts --verify-only
```
3. actual-run（type別）
```bash
node --loader ts-node/esm scripts/migrate-strapi-to-wordpress.ts --actual-run --type=blog-posts
```
4. failed resume
```bash
node --loader ts-node/esm scripts/migrate-strapi-to-wordpress.ts --actual-run --resume-failed-only --type=blog-posts
```

### 3-2. staged cutover
1. global on
   - `VITE_CMS_PROVIDER=wordpress`
   - `VITE_CMS_WORDPRESS_ROLLOUT_ENABLED=true`
2. site on（例: mainのみ）
   - `VITE_CMS_WORDPRESS_ROLLOUT_SITE_MAIN=true`
3. route on（例: news + discovery）
   - `VITE_CMS_WORDPRESS_ROLLOUT_NEWS=true`
   - `VITE_CMS_WORDPRESS_ROLLOUT_DISCOVERY_SEARCH=true`
4. 監視 24h
   - content取得失敗率
   - search no-result率
   - preview verify failure率

### 3-3. rollback
- route単位 rollback
  - `VITE_CMS_WORDPRESS_ROLLOUT_<ROUTE>=false`
- site単位 rollback
  - `VITE_CMS_WORDPRESS_ROLLOUT_SITE_<SITE>=false`
- 全面 rollback
  - `VITE_CMS_PROVIDER=strapi`

## 4. preview parity 確認
- `/preview?provider=wordpress&secret=...` で verify 成功する。
- draft は preview のみで見える。
- publish後は preview state なしでも本番表示される。

## 5. search parity 確認
- query: sourceSite/contentType/category/locale/memberState/sort/limit の組み合わせ。
- guestでは `fc_only/limited` が混入しない。
- no result で recommendations が返る。

## 6. decommission readiness
- Strapi依存一覧を毎週更新。
- readiness checklist の未完了項目をゼロ化するまで shutdown しない。

## 7. トラブルシュート
- `invalid_preview_secret`
  - WordPress runtime の `WORDPRESS_PREVIEW_SECRET` と frontend query の secret を再確認。
- discovery が空配列
  - rollout flag / site flag / content type filter の誤設定を確認。
- migration mode エラー
  - `--dry-run | --verify-only | --actual-run` のいずれか1つだけ指定する。
