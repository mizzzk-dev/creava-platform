# 画面設計書

- 更新日: 2026-04-10
- 対象: frontend 主要ページ
- 目的: 画面の責務・入力・導線を整理
- 前提: 3サイト（main/store/fc）
- 関連ドキュメント: [ページ遷移図](../10_appendix/architecture-diagrams.md)

## 1. 画面一覧

| サイト | 画面 | パス | 主目的 |
|---|---|---|---|
| main | Home | `/` | ハブ導線 |
| main | Works/News/Blog/Events | `/works` 等 | 情報発信 |
| main | Contact | `/contact` | 依頼獲得 |
| main | Store/Fanclub導線 | `/store`, `/fanclub` | サブドメインへ誘導 |
| store | StorefrontHome | `/` | 商品導線 |
| store | Products | `/products` | 一覧 |
| store | Product Detail | `/products/:handle` | 購入 |
| fanclub | Join/Login/MyPage | `/join` 等 | 会員導線 |
| fanclub | Movies/Gallery/Tickets | `/movies` 等 | 会員向け体験 |

## 2. 主要画面の入出力

### Contact
- 入力: 問い合わせ内容
- 出力: 送信成功/失敗
- 外部: Formspree

### Checkout Result
- 入力: Stripe遷移戻り
- 出力: 成功・キャンセル文言

## 3. a11y とUI要件

- 主要ボタンはキーボード操作可能
- フォーカス遷移を阻害しない
- ダークモード時の可読性を維持

## 4. 仮定

- 画面モック資料は未同梱のため、本書は実装コンポーネントを基準にしたテキスト設計書とする。
