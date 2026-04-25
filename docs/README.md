# プロジェクトドキュメントハブ

- 更新日: 2026-04-25
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
- [Strapi publish / preview / webhook revalidation / cache invalidation 運用 runbook (2026-04-24)](./09_operations/strapi-publish-preview-revalidation-runbook-2026-04-24.md)
- [WordPress 単独運用移行 / Strapi shutdown execution / decommission runbook (2026-04-25)](./09_operations/wordpress-strapi-shutdown-and-operations-hardening-runbook-2026-04-25.md)
- [WordPress production hardening / security / backup / restore / observability / DR runbook (2026-04-25)](./09_operations/wordpress-production-hardening-security-backup-dr-runbook-2026-04-25.md)
- [Strapi content model / relation / media / locale 再整理 runbook (2026-04-24)](./09_operations/strapi-content-model-restructure-runbook-2026-04-24.md)
- [CMS運用マニュアル](./09_operations/cms-manual.md)
- [デプロイ手順書](./09_operations/deploy-manual.md)
- [トラブルシューティング](./09_operations/troubleshooting.md)
- [Logto 本番運用ランブック](./09_operations/logto-production-auth-runbook.md)
- [Supabase Auth 単一認証基盤移行計画 (2026-04-21)](./09_operations/supabase-auth-migration-plan-2026-04-21.md)
- [Supabase Auth 前提 user domain 同期 / RLS / mypage 連携ランブック (2026-04-21)](./09_operations/supabase-user-domain-sync-runbook-2026-04-21.md)
- [Supabase Auth 前提 統一アカウントセンター / 設定ハブ runbook (2026-04-21)](./09_operations/supabase-account-center-settings-hub-runbook-2026-04-21.md)
- [Supabase Auth 前提 privacy / consent / export / deletion / retention runbook (2026-04-22)](./09_operations/supabase-privacy-consent-export-deletion-runbook-2026-04-22.md)
- [Supabase Auth 前提 internal admin / operations console / user 360 runbook (2026-04-22)](./09_operations/supabase-internal-admin-user360-operations-console-runbook-2026-04-22.md)
- [Supabase Auth 前提 status page / maintenance / incident communications / postmortem / RCA runbook (2026-04-22)](./09_operations/supabase-status-maintenance-incident-postmortem-runbook-2026-04-22.md)
- [Supabase Auth 前提 release management / deployment safety / rollback / parity / release notes runbook (2026-04-22)](./09_operations/supabase-release-management-deployment-safety-runbook-2026-04-22.md)
- [Supabase Auth 前提 analytics foundation / event taxonomy / attribution / experiment measurement / observability runbook (2026-04-22)](./09_operations/supabase-analytics-foundation-event-taxonomy-runbook-2026-04-22.md)
- [統一認証基盤を前提にした user lifecycle / onboarding / 会員導線整備 (2026-04-19)](./user-lifecycle-membership-onboarding-foundation-2026-04-19.md)
- [membershipStatus / entitlement / subscription / notification / CRM 同期基盤整備 (2026-04-19)](./membership-entitlement-subscription-sync-foundation-2026-04-19.md)
- [renewal / lifecycle messaging / win-back 基盤整備 (2026-04-19)](./renewal-lifecycle-retention-foundation-2026-04-19.md)
- [会員ランク/継続バッジ/ミッション/特典段階化 基盤整備 (2026-04-20)](./member-rank-progression-foundation-2026-04-20.md)
- [会員ランク連動キャンペーン / シーズナル特典 / パーソナライズ施策 基盤整備 (2026-04-21)](./member-campaign-personalization-foundation-2026-04-21.md)
- [Logto ユーザー同期/プロビジョニング基盤 (2026-04-18)](./logto-user-sync-foundation-2026-04-18.md)
- [internal admin / support / 監査ログ 基盤整備 (2026-04-18)](./internal-admin-support-audit-foundation-2026-04-18.md)
- [フォーム運用マニュアル](./09_operations/form-operations-manual.md)
- [お問い合わせフォーム復旧 runbook (2026-04-22)](./09_operations/contact-inquiry-recovery-runbook-2026-04-22.md)
- [support forecasting / staffing / capacity / surge / coverage 基盤整備 (2026-04-23)](./support-forecasting-staffing-capacity-foundation-2026-04-23.md)
- [proactive support / recommendation scoring / issue prevention runbook (2026-04-23)](./09_operations/proactive-support-recommendation-issue-prevention-runbook-2026-04-23.md)
- [multilingual support knowledge / localization / translation QA / locale-aware orchestration runbook (2026-04-24)](./09_operations/multilingual-support-knowledge-localization-runbook-2026-04-24.md)
- [multilingual support optimization / translation memory / glossary / locale retrieval runbook (2026-04-24)](./09_operations/multilingual-support-optimization-foundation-2026-04-24.md)
- [support policy governance / optimization audit / rollback / experiment guardrails / multilingual safety review runbook (2026-04-24)](./09_operations/support-policy-governance-rollback-guardrail-runbook-2026-04-24.md)
- [translation memory / glossary / multilingual semantic retrieval improvement / article localization workflow automation / locale-specific ranking tuning / regional policy templates runbook (2026-04-24)](./09_operations/multilingual-translation-memory-glossary-retrieval-workflow-runbook-2026-04-24.md)
- [分析基盤・改善運用ガイド](./09_operations/analytics-improvement-foundation.md)
- [GA4 / GTM / Search Console / Consent Mode 計測基盤 runbook (2026-04-24)](./09_operations/ga4-gtm-search-console-consent-foundation-2026-04-24.md)
- [analytics ops 基盤 runbook（BigQuery / Looker Studio / Clarity / funnel / attribution / anomaly）(2026-04-24)](./09_operations/analytics-ops-bigquery-looker-clarity-runbook-2026-04-24.md)
- [experimentation platform / feature flags / KPI guardrails / rollout workflow runbook (2026-04-24)](./09_operations/experimentation-platform-guardrails-runbook-2026-04-24.md)
- [SEO/コンテンツ流入基盤メモ（2026-04）](./seo-content-growth-foundation.md)
- [パーソナライズ導線運用メモ](./personalization-notification-center.md)
- [横断検索/発見導線 基盤](./discovery-search-recommendation-foundation-2026-04-18.md)
- [ロイヤルティ/継続導線 基盤 (2026-04-18)](./loyalty-retention-foundation-2026-04-18.md)
- [CRM/ライフサイクル配信・配信設定センター基盤 (2026-04-18)](./crm-lifecycle-delivery-center-foundation-2026-04-18.md)
- [課金/サブスク/Entitlement 運用基盤整備 (2026-04-18)](./subscription-entitlement-operations-foundation-2026-04-18.md)
- [売上/返金/レポーティング基盤整備 (2026-04-19)](./financial-reporting-revenue-foundation-2026-04-19.md)
- [データ基盤 / BI / KPI 統合基盤整備 (2026-04-19)](./data-platform-bi-kpi-foundation-2026-04-19.md)
- [施策実行/運用自動化 Playbook 基盤整備 (2026-04-19)](./workflow-playbook-automation-foundation-2026-04-19.md)
- [PWA / モバイル app-like 基盤整備 (2026-04-18)](./pwa-mobile-foundation-2026-04-18.md)
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

- [Supabase Auth 前提 alert / incident / approval / batch safe ops / escalation runbook (2026-04-22)](./09_operations/supabase-alert-incident-approval-batch-ops-runbook-2026-04-22.md)
