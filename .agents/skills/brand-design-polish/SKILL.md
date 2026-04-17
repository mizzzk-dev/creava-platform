---
name: brand-design-polish
description: 余白・タイポ・Hero・CTA・light/dark の最終品質を磨く skill。
---

# brand-design-polish

## いつ使うか
- UI品質改善
- ブランド一貫性の調整

## いつ使わないか
- 機能仕様変更や schema 変更が主目的のとき

## 入力として読むべきファイル
- `../references/design-principles.md`
- `docs/design/design-principles.md`
- 対象ページと共通レイアウト

## 実行手順
1. design context を1行で定義
2. Hero/余白/CTA を整理
3. light/dark と多言語崩れを点検

## 出力形式
- before/after の設計意図
- 改善点と非変更点

## repo 固有の注意点
- main はブランドハブ、store/fc は独立体験

## 破壊的変更を避けるチェック
- 導線（Home/Contact/store/fc）を壊さない

## build / test / review コマンド
- `npm run lint --prefix frontend`
- `npm run build:frontend`

## 日本語運用ルール
- デザイン判断理由は日本語で記述

## ブランチ / コミット / PR ルール
- 禁止語（`codex` / `Claude`）を含めない
