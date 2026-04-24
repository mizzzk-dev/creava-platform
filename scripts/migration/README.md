# Strapi -> WordPress migration

## コマンド

```bash
# dry run
node --loader ts-node/esm scripts/migrate-strapi-to-wordpress.ts --dry-run

# verify only
node --loader ts-node/esm scripts/migrate-strapi-to-wordpress.ts --verify-only

# content type / locale / limit 指定
node --loader ts-node/esm scripts/migrate-strapi-to-wordpress.ts --type=blog-posts --locale=ja --limit=50
```

## 必須環境変数
- `STRAPI_MIGRATION_SOURCE_URL`
- `STRAPI_MIGRATION_SOURCE_TOKEN`
- `WORDPRESS_MIGRATION_TARGET_URL`
- `WORDPRESS_MIGRATION_APP_TOKEN`

## 仕様
- `mapping.json` を upsert 更新し idempotent を維持
- report は `scripts/migration/reports/*.json` に保存
- verify で `slug / locale / accessStatus / missing_target` を分類

## 失敗時の再開
- `status=failed` のアイテムだけ対象にして `--type` + `--limit` で部分再実行
- rollback は frontend の provider flag を strapi 側へ戻し、WP 側データは保持
