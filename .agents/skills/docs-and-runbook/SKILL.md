---
name: docs-and-runbook
description: 実装実態に合わせて docs/runbook/setup/troubleshooting を更新する skill。
---

# docs-and-runbook

## いつ使うか
- ドキュメント更新
- 運用手順・環境変数・障害対応更新

## いつ使わないか
- 口頭要約だけで済む時

## 入力として読むべきファイル
- `docs/*`
- `README.md`, `AGENTS.md`
- `.github/workflows/*`

## 実行手順
1. コード実態との差分抽出
2. 影響範囲別に docs 更新
3. 運用コマンド・未確認事項を明記

## 出力形式
- 更新ドキュメント一覧
- 差分理由
- 未反映/今後対応

## repo 固有の注意点
- docs の古い記述（認証/フォーム/環境変数）に注意

## 破壊的変更を避けるチェック
- 手順の前提バージョンとコマンド整合

## build / test / review コマンド
- `npm run build:frontend`
- `npm run build:backend`

## 日本語運用ルール
- docs は日本語を基本

## ブランチ / コミット / PR ルール
- 禁止語を含めない
