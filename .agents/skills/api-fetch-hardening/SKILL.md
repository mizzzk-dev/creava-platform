---
name: api-fetch-hardening
description: Strapi API クライアントの堅牢化（content-type/HTML混入/retry/timeout/error UX）skill。
---

# api-fetch-hardening

## いつ使うか
- 初回読み込み不安定
- API障害耐性の改善

## いつ使わないか
- APIに無関係なUI調整

## 入力として読むべきファイル
- `frontend/src/lib/api/client.ts`
- `frontend/src/lib/api/strapi.ts`
- `../references/fetch-hardening-checklist.md`

## 実行手順
1. エラー経路（ok/content-type/HTML）を洗い出し
2. timeout/retry/backoff を統一
3. ユーザー向けエラーUXを改善

## 出力形式
- ハードニング項目チェック結果
- 既知の未対応項目

## repo 固有の注意点
- main/store/fc の全API体験に波及するため共通層優先

## 破壊的変更を避けるチェック
- レスポンス型互換維持
- fallback 削除による白画面化を避ける

## build / test / review コマンド
- `npm run test:frontend`
- `npm run build:frontend`

## 日本語運用ルール
- 障害時挙動を日本語で説明

## ブランチ / コミット / PR ルール
- 禁止語を含めない
