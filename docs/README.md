# プロジェクトドキュメントハブ

- 更新日: 2026-04-18
- 対象: `creava-platform` の frontend / backend / docs
- 目的: 未経験者でも「構成・実装・運用・保守」の全体像を理解できるようにする
- 前提: 本書は実装コード（`frontend/src`, `backend/src`, `backend/config`, `.github/workflows`）を基準に作成

## 1. まず読む順番（未経験者向け）

1. [システム概要](./01_overview/system-overview.md)
2. [リポジトリ構成説明](./01_overview/repository-structure.md)
3. [要件定義書](./02_requirements/requirements-definition.md)
4. [基本設計書](./03_basic-design/basic-design.md)
5. [詳細設計書](./04_detailed-design/detailed-design.md)
6. [運用マニュアル](./09_operations/operations-manual.md)

## 2. ドキュメント一覧

### ガイダンス（durable）
- [デザイン原則](./design/design-principles.md)
- [ブランド・パーソナリティ](./design/brand-personality.md)
- [参考/非参考ガイド](./design/reference-and-anti-reference.md)
- [UI Critique チェックリスト](./design/ui-critique-checklist.md)
- [リポジトリアーキテクチャ](./architecture/repo-architecture.md)
- [frontend 境界ルール](./architecture/frontend-boundaries.md)
- [Strapi 境界ルール](./architecture/strapi-boundaries.md)
- [APIクライアント/fetch ルール](./architecture/api-client-and-fetch-rules.md)
- [変更安全チェックリスト](./architecture/change-safety-checklist.md)


### 概要
- [システム概要書](./01_overview/system-overview.md)
- [リポジトリ構成説明書](./01_overview/repository-structure.md)
- [用語集](./01_overview/glossary.md)

### 設計
- [要件定義書](./02_requirements/requirements-definition.md)
- [基本設計書](./03_basic-design/basic-design.md)
- [詳細設計書](./04_detailed-design/detailed-design.md)
- [API設計書](./05_api/api-specification.md)
- [DB設計書](./06_database/database-design.md)
- [画面設計書](./07_screens/screen-specification.md)

### 品質
- [テスト仕様書](./08_test/test-specification.md)

### 運用
- [運用マニュアル](./09_operations/operations-manual.md)
- [CMS運用マニュアル](./09_operations/cms-manual.md)
- [デプロイ手順書](./09_operations/deploy-manual.md)
- [トラブルシューティング](./09_operations/troubleshooting.md)
- [フォーム運用マニュアル](./09_operations/form-operations-manual.md)
- [分析基盤・改善運用ガイド](./09_operations/analytics-improvement-foundation.md)
- [SEO/コンテンツ流入基盤メモ（2026-04）](./seo-content-growth-foundation.md)
- [パーソナライズ導線運用メモ](./personalization-notification-center.md)
- [横断検索/発見導線 基盤](./discovery-search-recommendation-foundation-2026-04-18.md)
- [ロイヤルティ/継続導線 基盤 (2026-04-18)](./loyalty-retention-foundation-2026-04-18.md)
- [CRM/ライフサイクル配信・配信設定センター基盤 (2026-04-18)](./crm-lifecycle-delivery-center-foundation-2026-04-18.md)
- [コミュニティ参加 / UGC / モデレーション基盤 (2026-04-18)](./community-participation-foundation-2026-04-18.md)

### 付録
- [環境変数一覧](./10_appendix/environment-variables.md)
- [リリースチェックリスト](./10_appendix/release-checklist.md)
- [アーキテクチャ図集](./10_appendix/architecture-diagrams.md)

## 3. 既存ドキュメントとの関係

`docs/` 直下にある既存運用メモ（例: `deploy-production.md`, `stripe-deployment-runbook.md`）は、現場の履歴情報として引き続き有効です。  
本セットは、これらを横断する「入口資料」として位置づけます。

## 4. 仮定と要確認

- 仮定: 本番運用で使う GitHub Environments の reviewer / assignee ルールは組織設定で別途管理される。
- 要確認: 本番運用の reviewer / assignee / milestone の固定ルールは、GitHub 組織設定側での最終確認が必要。
