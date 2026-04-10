# 用語集

- 更新日: 2026-04-10
- 対象: 未経験者・新規参画者
- 目的: 専門用語で詰まらないようにする
- 前提: 本プロジェクト独自語 + 一般Web語を混在
- 関連ドキュメント: [要件定義書](../02_requirements/requirements-definition.md)

## 主要用語

- **mainサイト**: ブランド訴求の入口サイト（`VITE_SITE_TYPE=main`）
- **storeサイト**: 商品導線に特化したサブドメインサイト
- **fanclubサイト**: 会員向け導線に特化したサブドメインサイト
- **Strapi**: ヘッドレスCMS。管理画面からコンテンツを作成し API 提供する
- **Content Type**: Strapi でのデータモデル定義（テーブルに近い概念）
- **`accessStatus`**: 公開レベル (`public` / `fc_only` / `limited`)
- **Clerk**: 認証SaaS。未設定時はゲスト動作へフォールバック
- **Formspree**: フォーム送信先SaaS
- **Stripe Checkout**: 決済画面へ遷移する方式
- **Webhook**: 外部サービスからのサーバー通知（決済完了通知など）
