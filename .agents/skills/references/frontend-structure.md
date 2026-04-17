# frontend-structure

- `src/pages`: ルート単位
- `src/modules`: 機能単位
- `src/components`: 共通UI
- `src/hooks`: 横断Hook
- `src/lib`: API/i18n/theme/seo/routes

## 注意
- route は `routeConstants.ts` 起点。
- main/store/fc は `siteLinks.ts` と `routes.tsx` の分岐で成立。
- SEOは `PageHead` / `StructuredData` を維持。
