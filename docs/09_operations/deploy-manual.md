# デプロイ手順書

- 更新日: 2026-04-18
- 対象: リリース担当
- 目的: main/store/fc + Strapi backend を安全にリリースする
- 前提: GitHub Actions + FTP + Strapi Cloud
- 関連: [production-reliability-runbook](./production-reliability-runbook.md), [release-checklist](../10_appendix/release-checklist.md)

## 1. Frontend デプロイ

- ワークフロー: `.github/workflows/deploy.yml`
- トリガー:
  - `main` push → production
  - `staging` push → staging
  - `workflow_dispatch` で手動指定
- 処理:
  - matrix で `main/store/fanclub` を個別 build
  - site 別 sitemap を差し替え
  - FTP へ配信

### 必須 Secrets / Variables
- `VITE_STRAPI_API_URL`, `VITE_STRAPI_API_TOKEN`
- `VITE_LOGTO_*`
- `VITE_SHOPIFY_*`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- FTP 系 (`FTP_SERVER_*`, `FTP_USERNAME_*`, `FTP_PASSWORD_*`, `FTP_SERVER_DIR_*`)
- SNS variables (`VITE_SNS_*`)

## 2. Backend デプロイ

- ワークフロー: `.github/workflows/deploy-backend.yml`
- デプロイ方式:
  - Strapi Cloud (`STRAPI_DEPLOY_TOKEN`)
  - VPS SSH（必要時）
- VPS deploy 後は `/_health` で起動確認

## 3. 監視・死活確認

- ワークフロー: `.github/workflows/ops-monitoring.yml`
- 15分ごとに以下を確認:
  - main/store/fc home
  - main `/faq` `/contact`
  - backend `/_health`, `/_ready`
- backend URL は Secrets:
  - `MONITORING_BACKEND_HEALTH_URL`
  - `MONITORING_BACKEND_READY_URL`

## 4. staging / production 分離

- deploy.yml / deploy-backend.yml とも GitHub Environment を利用
- secrets は staging / production を必ず分離
- runtime env（Strapi Cloud/VPS）も環境ごとに分離

## 5. ロールバック方針

### frontend
1. 直前の安定コミットを checkout
2. 同 workflow を再実行
3. 反映後 synthetic monitoring を再確認

### backend
1. 直前安定版へ再デプロイ
2. 必要時 DB/media restore
3. `/_ready` が `ready` になることを確認

## 6. DNS 変更要否

- 本手順の強化は既存ドメイン運用内で完結するため、**DNS変更は不要**。
