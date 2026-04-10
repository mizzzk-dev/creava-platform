# リポジトリ構成説明書

- 更新日: 2026-04-10
- 対象: リポジトリ構造・責務
- 目的: どこに何があるか迷わないようにする
- 前提: モノレポ（frontend + backend）
- 関連ドキュメント: [環境変数一覧](../10_appendix/environment-variables.md)

## 目次
1. ルート構成
2. frontend 詳細
3. backend 詳細
4. docs / CI-CD

## 1. ルート構成

- `frontend/`: React アプリ
- `backend/`: Strapi API
- `docs/`: 運用・仕様書
- `.github/workflows/`: CI/CD
- `package.json`: ルート共通スクリプト

## 2. frontend 詳細

- `src/pages`: ルーティングされるページ
- `src/modules`: 機能別ロジック（store, contact, payments など）
- `src/components`: 再利用UI
- `src/lib`: ルート定数、APIクライアント、i18n、theme
- `src/locales`: `ja/en/ko` 翻訳

## 3. backend 詳細

- `src/api/*/content-types/*/schema.json`: Content Type 定義（実質 DB モデル定義）
- `src/api/*/routes`: エンドポイント定義
- `src/api/*/controllers`: 入力検証・レスポンス
- `src/lib/stripe`: Stripe 連携
- `config/*`: DB, CORS, middleware, server 設定

## 4. docs / CI-CD

- 既存 docs: セットアップ、デプロイ、運用メモ
- CI: `ci.yml`（PRメタ確認 + frontend test/lint/build）
- Deploy: `deploy.yml`（main/store/fanclub を環境別にFTP配信）
