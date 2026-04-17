---
name: fanclub-experience
description: fanclub サイトの会員導線と限定公開制御を安全に改善する skill。
---

# fanclub-experience

## いつ使うか
- Join/Login/MyPage 導線改善
- fc_only / limited 表示改善

## いつ使わないか
- 一般ページのみの軽微な見た目調整

## 入力として読むべきファイル
- `frontend/src/modules/fanclub/*`
- `frontend/src/pages/fc/*`
- `backend/src/api/fanclub-content/*`

## 実行手順
1. 会員状態別の表示差を確認
2. 制限表示・導線・アーカイブ扱いを調整
3. 非会員導線（join/login）を明確化

## 出力形式
- 状態別挙動一覧
- 回帰チェック結果

## repo 固有の注意点
- 公開制御を最優先で保護

## 破壊的変更を避けるチェック
- `fc_only` と `archiveVisibleForFC` の意味を変えない

## build / test / review コマンド
- `npm run test:frontend`
- `npm run build:frontend`

## 日本語運用ルール
- 制限仕様の説明は日本語で明文化

## ブランチ / コミット / PR ルール
- 禁止語を含めない
