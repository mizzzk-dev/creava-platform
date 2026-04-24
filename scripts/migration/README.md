# Strapi -> WordPress migration

## コマンド

```bash
# dry run（writeなし）
node --loader ts-node/esm scripts/migrate-strapi-to-wordpress.ts --dry-run

# verify only（差分監査のみ）
node --loader ts-node/esm scripts/migrate-strapi-to-wordpress.ts --verify-only

# actual run（本実行）
node --loader ts-node/esm scripts/migrate-strapi-to-wordpress.ts --actual-run

# content type / locale / limit 指定
node --loader ts-node/esm scripts/migrate-strapi-to-wordpress.ts --actual-run --type=blog-posts --locale=ja --limit=50

# failed のみ再開
node --loader ts-node/esm scripts/migrate-strapi-to-wordpress.ts --actual-run --resume-failed-only --type=store-products
```

## 必須環境変数
- `STRAPI_MIGRATION_SOURCE_URL`
- `STRAPI_MIGRATION_SOURCE_TOKEN`
- `WORDPRESS_MIGRATION_TARGET_URL`
- `WORDPRESS_MIGRATION_APP_TOKEN`

## verify / diff 仕様（PR #231 次段 hardening + execution readiness）
- `mapping.json` を upsert 更新し idempotent を維持
- report は `scripts/migration/reports/*.json` に保存
- verify で `slug / locale / accessStatus / missing_target` を分類
- mismatch は `critical / high / medium` に severity 分類
  - `critical`: missing_target
  - `high`: accessStatus mismatch
  - `medium`: slug / locale mismatch
- report に下記 state を必ず出力
  - `migrationExecutionState`
  - `migrationDryRunState`
  - `migrationVerifyState`
  - `migrationReportState`
  - `migrationDiffState`
  - `migrationIdempotencyState`
  - `migrationRollbackState`
  - `migrationTraceId`
  - `migrationStartedAt / migrationCompletedAt / migrationVerifiedAt`

## rollback criteria（最小）
- `critical > 0` または `high > 0` の場合は rollout を進めない
- `medium` は許容理由を issue/PR に明記したうえで段階移行する
- rollback は frontend の provider rollout flag を unit 単位で Strapi 側へ戻す

## 失敗時の再開
- `--resume-failed-only` を使って `status=failed` アイテムだけ再実行する
- rollback は frontend の provider flag を strapi 側へ戻し、WP 側データは保持
