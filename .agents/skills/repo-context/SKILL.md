---
name: repo-context
description: repo 全体文脈（main/store/fc/backend/docs差分）を固定する初動 skill。新規タスク開始時に使う。
---

# repo-context

## いつ使うか
- 新規タスク着手時
- docs と実装差分の確認が必要なとき

## いつ使わないか
- 単純 typo 修正のみ

## 入力として読むべきファイル
- `README.md`, `AGENTS.md`
- `docs/README.md` と関連 docs
- `frontend/src/lib/routes.tsx`, `routeConstants.ts`, `siteLinks.ts`
- `frontend/src/lib/auth/*`, `frontend/src/modules/contact/lib/submit.ts`
- `backend/src/api/*`, `backend/config/*`, `.github/workflows/*`
- `../references/project-context.md`

## 実行手順
1. docs とコードの差分を列挙
2. main/store/fc/backend/docs への影響範囲を宣言
3. 破壊的変更リスク（route/slug/endpoint/schema）を事前確認

## 出力形式
- 現状要約
- docs と実装のズレ
- 変更優先順位
- 未確認事項

## repo 固有の注意点
- `mizzz.jp` はハブ、store/fc は独立体験
- 認証/フォームは docs よりコード実態優先

## 破壊的変更を避けるチェック
- URL/slug/endpoint/schema を維持
- FC 公開制御を維持
- Home ハブ性を維持

## build / test / review コマンド
- `npm run test:frontend`
- `npm run lint --prefix frontend`

## 日本語運用ルール
- 調査結果の要約・PR文面は日本語

## ブランチ / コミット / PR ルール
- ブランチ名は英小文字+ハイフン
- `codex` / `Claude` を含めない
- コミット・PR は日本語
