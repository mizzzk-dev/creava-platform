# テスト仕様書

- 更新日: 2026-04-10
- 対象: frontend / backend / 運用テスト
- 目的: 回帰防止の観点を明文化
- 前提: 自動テストは frontend 中心
- 関連ドキュメント: [リリースチェックリスト](../10_appendix/release-checklist.md)

## 1. テスト対象一覧

- ユニット: `utils`, `contact validation`
- 静的検査: eslint
- ビルド検証: frontend/build, backend/build
- 手動: 画面導線、CMS公開、決済導線

## 2. 観点一覧

- 画面: main/store/fc の主要導線、404、エラーページ
- API: GET/POST 正常系・異常系
- CMS: draft/publish と公開反映
- 多言語: ja/en/ko キー欠落
- テーマ: light/dark/system
- 権限: guest/member/premium/admin の表示差
- モバイル: 主要ページ崩れ
- パフォーマンス: 初回表示と遅延ロード
- リグレッション: routeConstants 変更影響

## 3. 期待結果例

- `accessStatus=fc_only` はゲストに非表示
- `limited` + 期限切れ + `archiveVisibleForFC=false` は非表示
- Formspree ID 未設定時でも開発でクラッシュしない

## 4. 実行コマンド

- `npm run test:frontend`
- `npm run lint --prefix frontend`
- `npm run build:frontend`
- `npm run build:backend`

## 5. 要確認

- backend の自動テスト基盤（Jest等）は未整備。将来的にAPI統合テスト追加を推奨。
