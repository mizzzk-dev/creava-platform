# アーキテクチャ図集

- 更新日: 2026-04-10
- 対象: 設計把握
- 目的: 文章だけでは把握しづらい依存関係を図示
- 前提: Mermaid表示対応環境
- 関連ドキュメント: [basic-design](../03_basic-design/basic-design.md)

## 1. 画面遷移（簡略）

```mermaid
flowchart TD
  H[Home] --> W[Works]
  H --> N[News]
  H --> B[Blog]
  H --> E[Events]
  H --> C[Contact]
  H --> S[Store site]
  H --> F[Fanclub site]
```

## 2. データフロー（Checkout）

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant BE as Strapi API
  participant ST as Stripe

  U->>FE: 購入ボタン
  FE->>BE: POST /payments/*/checkout-session
  BE->>ST: セッション作成
  ST-->>BE: session url
  BE-->>FE: url
  FE->>ST: リダイレクト
  ST->>BE: webhook
  BE->>BE: payment/subscription記録
```

## 3. 権限マトリクス（簡略）

| ロール | public | fc_only | limited(期限内) | limited(期限後+archiveVisibleForFC) |
|---|---:|---:|---:|---:|
| guest | ✅ | ❌ | ✅ | ❌ |
| member/premium/admin | ✅ | ✅ | ✅ | ✅ |
