---
name: strapi-content-model
description: Strapi v5 の content-type/relation/populate/Draft-Publish を安全に扱う skill。
---

# strapi-content-model

## いつ使うか
- schema 変更
- relation/publish 設定変更

## いつ使わないか
- frontend 見た目調整のみ

## 入力として読むべきファイル
- `../references/backend-strapi-structure.md`
- `../references/strapi-pitfalls.md`
- 対象 `backend/src/api/*/content-types/*/schema.json`

## 実行手順
1. schema 差分を最小化
2. relation/populate 影響を確認
3. frontend endpoint/型/表示の追従を確認

## 出力形式
- 変更 schema 一覧
- frontend 影響
- 移行要否

## repo 固有の注意点
- Draft/Publish と FC 制御の両立が必須

## 破壊的変更を避けるチェック
- 既存 endpoint とフィールド互換性を確認
- seed データの成立確認

## build / test / review コマンド
- `npm run build:backend`
- `npm run seed:backend`

## 日本語運用ルール
- schema 変更理由を日本語で記録

## ブランチ / コミット / PR ルール
- 禁止語を含めない
