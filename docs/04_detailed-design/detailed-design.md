# 詳細設計書

- 更新日: 2026-04-10
- 対象: 実装者
- 目的: 主要画面・処理・バリデーション・エラー時挙動を実装単位で説明
- 前提: 現行コード準拠
- 関連ドキュメント: [画面設計書](../07_screens/screen-specification.md), [テスト仕様書](../08_test/test-specification.md)

## 1. 画面詳細（抜粋）

### 1.1 Contactページ
- 入力: name, email, subject, message（request側は company, budget など追加）
- バリデーション: 必須、メール形式、最小文字数、添付ファイル形式/サイズ
- 送信先: Formspree（ID未設定時は開発スタブ）
- エラー時: `status=error` 表示

### 1.2 Store商品詳細
- データ元: `/store-products` + handle/slug
- 条件: `purchaseStatus`, `stock`, `isPurchasable`, `accessStatus`
- 成功時: checkout API でURL取得し外部遷移

### 1.3 FC保護ページ
- 手順: 読込完了待ち → ログイン判定 → メール認証判定 → 契約状態判定
- 失敗時: Join/Login 導線表示

## 2. API呼び出し詳細

- GET系: `strapiGet` を通し、timeout/retry/cache/stale-while-revalidate 実装
- POST系: `modules/payments/api.ts` で JSON POST
- 認証付きPOST: Bearer token を付与

## 3. エラーハンドリング

- `StrapiApiError` で status / snippet / requestId を保持
- HTML応答混入時に専用メッセージで原因候補を提示
- Backend は `json-api-error` middleware で JSON 形式を維持

## 4. 状態管理

- cart: Context + localStorage
- user: Clerk 経由正規化
- theme/lang: localStorage永続化

## 5. 条件分岐

- `VITE_SITE_TYPE` によるルーティング分岐（main/store/fc）
- `VITE_CLERK_PUBLISHABLE_KEY` 有無で認証機能の有効/無効切替

## 6. 仮定

- storeの一部データは将来 Shopify 連携を見据えたフィールドを保持している（現状はStrapi主体運用）。
