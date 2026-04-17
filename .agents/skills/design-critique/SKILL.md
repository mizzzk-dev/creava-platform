---
name: design-critique
description: 実装後UIを批評し、テンプレ感・可読性・導線バランス・a11y・dark対応を点検する skill。
---

# design-critique

## いつ使うか
- UI実装後のレビュー

## いつ使わないか
- 新機能実装の初期段階

## 入力として読むべきファイル
- `docs/design/ui-critique-checklist.md`
- `../references/design-principles.md`
- 変更したページ/コンポーネント

## 実行手順
1. 役割（main/store/fc）を確認
2. テンプレ感・過剰演出を点検
3. 可読性・a11y・light/dark を点検

## 出力形式
- 問題点（重要度順）
- すぐ直す項目 / 次回対応項目

## repo 固有の注意点
- main のブランドハブ性を守る

## 破壊的変更を避けるチェック
- critique のために機能仕様を変えすぎない

## build / test / review コマンド
- `npm run build:frontend`

## 日本語運用ルール
- 批評コメントは日本語で具体的に

## ブランチ / コミット / PR ルール
- 禁止語を含めない
