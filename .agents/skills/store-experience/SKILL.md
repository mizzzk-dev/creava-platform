---
name: store-experience
description: store サイトの購買体験（商品導線/案内/不安解消）を改善する skill。
---

# store-experience

## いつ使うか
- 商品一覧/詳細/ガイド/FAQ 導線改善

## いつ使わないか
- main のブランド訴求改善のみを行うとき

## 入力として読むべきファイル
- `frontend/src/modules/store/*`
- `frontend/src/pages/storefront/*`
- `../references/project-context.md`

## 実行手順
1. 購買導線（一覧→詳細→購入）を確認
2. 在庫状態（available/soldout/coming_soon）表示を点検
3. Guide/FAQ/News への補助導線を調整

## 出力形式
- 導線改善点
- 回帰確認（在庫・CTA）

## repo 固有の注意点
- store強化しても main をEC主役にしない

## 破壊的変更を避けるチェック
- 商品 slug / URL / 購入リンク仕様を壊さない

## build / test / review コマンド
- `npm run lint --prefix frontend`
- `npm run test:frontend`

## 日本語運用ルール
- 変更理由を日本語で残す

## ブランチ / コミット / PR ルール
- 禁止語を含めない
