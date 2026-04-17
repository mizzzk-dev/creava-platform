---
name: issue-pr-writer-ja
description: この repo ルールに沿って日本語 issue/PR/commit/branch 文面を整える skill。
---

# issue-pr-writer-ja

## いつ使うか
- コミット作成時
- PR 本文作成時

## いつ使わないか
- コード調査・実装そのもの

## 入力として読むべきファイル
- `AGENTS.md`
- `../references/writing-rules-ja.md`
- `../references/release-review-checklist.md`

## 実行手順
1. 変更内容を日本語で要約
2. PRメタデータ YAML を先頭に配置
3. 確認手順・影響範囲・リスクを明文化

## 出力形式
- ブランチ名案
- コミットメッセージ案
- PRタイトル/本文案
- PRメタデータ案

## repo 固有の注意点
- `codex` / `Claude` を名称に含めない

## 破壊的変更を避けるチェック
- 破壊的変更有無と移行手順を明記

## build / test / review コマンド
- `npm run test:frontend`
- `npm run build:frontend`

## 日本語運用ルール
- すべて日本語で記述

## ブランチ / コミット / PR ルール
- 禁止語を含めない
