# CMS運用マニュアル

- 更新日: 2026-04-10
- 対象: Strapi運用者
- 目的: 公開事故を防ぎながら更新できるようにする
- 前提: Strapi管理画面アクセス権あり
- 関連ドキュメント: [DB設計書](../06_database/database-design.md)

## 1. 基本操作

- Entry作成 → 必須項目入力 → draft保存
- 表示確認後に publish
- 修正時は再保存 + 再publish

## 2. 公開制御の注意

- `accessStatus` を必ず確認
- `limitedEndAt` を設定したら期限後挙動を確認
- `archiveVisibleForFC` は期限後アーカイブ可否に影響

## 3. Store運用ポイント

- `purchaseStatus` (`available/soldout/coming_soon`)
- `isPurchasable`, `stock`, `price`, `currency`
- Stripe連携商品は `stripePriceId` を設定

## 4. Fanclub運用ポイント

- `fc_only` 前提の公開設計
- teaser と本公開を分ける場合は `accessStatus` と公開日時を分離

## 5. 要確認

- 管理画面ロール権限の最小権限設計は別途権限マトリクスで詳細化推奨。
