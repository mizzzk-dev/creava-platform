# デプロイ手順書

- 更新日: 2026-04-10
- 対象: リリース担当
- 目的: main/store/fc のデプロイ手順を明確化
- 前提: GitHub Actions + FTP + Strapi Cloud
- 関連ドキュメント: [release-checklist](../10_appendix/release-checklist.md)

## 1. Frontend

- トリガー: `main` / `staging` push または workflow_dispatch
- 処理: matrix(main/store/fanclub) で build 後 FTP 配信
- 必須Secrets: Strapi/Clerk/Stripe/Formspree/FTP

## 2. Backend

- Strapi Cloud 側の Git 連携デプロイを利用
- `backend/` を root directory として運用

## 3. リリース前確認

- sitemap 切替対象が正しいか
- site URL 環境変数が環境に一致するか
- checkout success/cancel URL が最新か

## 4. ロールバック方針（簡易）

- frontend: 直前の安定コミットを再デプロイ
- backend: Strapi Cloud で直前版へ戻す
