# frontend 境界ルール

## レイヤー責務
- `pages`: ルーティング単位の組み立て。
- `modules`: 機能別 UI/状態/API 呼び出し。
- `components`: 汎用 UI。
- `hooks`: 横断ロジック。
- `lib`: API client, route constants, i18n, theme, seo。

## 実装ルール
- route は `routeConstants.ts` 起点で定義。
- data fetch は module API / lib API を経由。
- i18n key 追加時は `ja/en/ko` を同時更新。
- SEO 更新時は title/description/canonical/OG/JSON-LD をセットで確認。

## 禁止事項
- pages への重いビジネスロジック直書き。
- main/store/fc の役割を混線させる導線追加。
- 既存 slug パラメータ名の変更。
