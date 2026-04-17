---
name: frontend-implementation
description: frontend の pages/modules/components/hooks/lib の責務に沿って安全に実装する skill。
---

# frontend-implementation

## いつ使うか
- ページ追加/改修
- main/store/fc 導線調整

## いつ使わないか
- Strapi schema 主体の変更
- fetch hardening 主体の変更

## 入力として読むべきファイル
- `../references/frontend-structure.md`
- `frontend/src/lib/routes.tsx`, `routeConstants.ts`
- 対象 `modules/*`, `components/*`, `hooks/*`, `lib/*`

## 実行手順
1. page と module の責務分離
2. routeConstants 起点でルート整合
3. i18n（ja/en/ko）同時更新
4. light/dark・a11y・SEO/JSON-LD を確認

## 出力形式
- 変更ファイル
- レイヤー責務対応表
- 回帰確認項目

## repo 固有の注意点
- main をEC主役化しない
- store/fc は独立体験として磨く

## 破壊的変更を避けるチェック
- 既存 slug param 名維持
- legacy redirect 維持

## build / test / review コマンド
- `npm run lint --prefix frontend`
- `npm run test:frontend`
- `npm run build:frontend`

## 日本語運用ルール
- 実装意図と確認結果は日本語記録

## ブランチ / コミット / PR ルール
- `codex` / `Claude` を含めない
- コミット/PRは日本語
