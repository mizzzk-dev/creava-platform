# 運用マニュアル

- 更新日: 2026-04-10
- 対象: 日常運用担当
- 目的: 開発環境構築〜日常更新〜障害初動を標準化
- 前提: Node.js / npm 利用
- 関連ドキュメント: [CMS運用マニュアル](./cms-manual.md), [デプロイ手順書](./deploy-manual.md), [本番運用ランブック](./production-reliability-runbook.md)

## 1. 開発環境立ち上げ

1. `npm run install:all`
2. frontend の `.env` を設定
3. backend は `config` を見ながら `.env` を作成（要手動）
4. `npm run dev:frontend` / `npm run dev:backend`

## 2. よくある更新作業

- News/Blog追加: CMSで作成→publish→frontend反映確認
- Store更新: 在庫・販売状態・price/stripe情報確認
- Fanclub更新: `accessStatus` と期間制御確認

## 3. エラー時の確認

- Frontend: ブラウザConsole、Network、`StrapiApiError` 内容
- Backend: Strapiログ、webhook-event-log、rate-limitログ
- 外部連携: Logto/SMTP/Stripe secret の期限切れ

## 4. 問い合わせ対応時の確認観点

- 発生画面/URL
- 再現手順
- ログイン状態
- 言語・テーマ
- API応答コード

## 5. 未経験者向け作業フロー

1. docs/README で全体把握
2. sandbox相当環境で変更
3. lint/test/build 実行
4. PRテンプレに沿って提出


## 6. フォーム運用

問い合わせ運用の詳細は [フォーム運用マニュアル](./form-operations-manual.md) を参照。


## 7. 本番運用の基準

- 監視対象・障害初動・復旧手順は [production-reliability-runbook](./production-reliability-runbook.md) を正とする。
- リリース前後の確認は [release-checklist](../10_appendix/release-checklist.md) を必須とする。
- 障害調査時は `x-request-id` を優先して frontend と backend を照合する。
