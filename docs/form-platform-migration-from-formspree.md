# Formspree 撤去 + Strapi 自前フォーム基盤 移行手順

## 概要
- 目的: `Formspree` 依存を撤去し、`backend(Strapi)` で問い合わせ送信を完結させる。
- 対象フォーム: main `/contact`（お問い合わせ・仕事依頼）、store 再入荷通知。
- 管理UI: Strapi Admin の `Inquiry Submission` コレクションで一覧/詳細/絞り込み/ステータス更新を実施。

## Formspree 依存箇所（移行前）
- `frontend/src/modules/contact/lib/submit.ts`
- `frontend/src/modules/store/lib/restock.ts`
- `frontend/.env.example` の `VITE_FORMSPREE_*`
- 各種運用 docs の Formspree 手順

## 新構成
- API: `POST /api/inquiry-submissions/public`
- 保存先: `api::inquiry-submission.inquiry-submission`
- 添付: Strapi Upload Plugin（Media Library）
- スパム対策:
  - honeypot (`website`)
  - server-side validation
  - グローバル rate-limit + 送信IP単位の burst 制限
  - MIME / size / 件数制限
  - spam score + `status=spam`

## データモデル
`Inquiry Submission` が以下を保持:
- `formType`, `inquiryCategory`, `name`, `companyOrOrganization`, `email`, `phone`, `subject`, `message`
- `attachments`, `locale`, `sourcePage`, `sourceSite`
- `status`, `adminMemo`, `submittedAt`, `handledAt`, `handler`
- `ipHash`, `userAgent`, `policyAgree`, `consentTextVersion`
- `spamScore`, `spamReason`, `meta`

## 送信フロー
1. 入力画面
2. 確認画面
3. 送信成功 / 失敗結果画面
4. 管理者は Strapi Admin で `status` と `adminMemo` を更新

## 添付ファイル運用ルール
- 許可: PDF / Office / 画像
- 最大サイズ: 10MB（`INQUIRY_MAX_FILE_BYTES`）
- 最大件数: 5件（`INQUIRY_MAX_FILES`）
- 危険拡張子は MIME ベースで拒否

## 環境変数
### frontend
- `VITE_STRAPI_API_URL`
- `VITE_SITE_TYPE` (`main` / `store` / `fc`)

### backend
- `INQUIRY_MAX_FILE_BYTES`
- `INQUIRY_MAX_FILES`
- `INQUIRY_SPAM_WINDOW_MS`
- `INQUIRY_SPAM_MAX_PER_WINDOW`
- `INQUIRY_IP_HASH_SALT`
- `UPLOAD_MAX_FILE_SIZE_BYTES`

## GitHub Secrets / Variables
- frontend build:
  - `VITE_STRAPI_API_URL`
  - `VITE_SITE_TYPE`
- backend runtime:
  - `INQUIRY_IP_HASH_SALT`
  - `INQUIRY_MAX_FILE_BYTES`
  - `INQUIRY_MAX_FILES`
  - `INQUIRY_SPAM_WINDOW_MS`
  - `INQUIRY_SPAM_MAX_PER_WINDOW`
  - `UPLOAD_MAX_FILE_SIZE_BYTES`

## DNS
- 既存 `mizzz.jp / store.mizzz.jp / fc.mizzz.jp` と既存API内で完結するため **DNS変更不要**。

## ローカル確認
```bash
npm run dev:backend
npm run dev:frontend
```
- `/contact` で入力→確認→送信→成功/失敗画面
- Strapi Admin の `Inquiry Submission` にレコード保存
- 添付ファイルが Media Library で参照できる

## staging / production 確認
- CORS の `FRONTEND_URL` に各ドメインが設定済みか確認
- `status=new` の件数が管理画面で追えること
- 添付ダウンロード権限を運用ポリシー通りに設定

## Formspree 撤去手順
1. `VITE_FORMSPREE_*` を削除
2. frontend の Formspree 送信実装を削除
3. Formspree ダッシュボード運用手順を docs から削除/置換
4. 本番送信を Strapi 側で受信できることを確認後、Formspree 側フォームを停止

## トラブルシュート
- 413: `UPLOAD_MAX_FILE_SIZE_BYTES` を確認
- 400: MIME不一致、必須不足、policy未同意
- 429: レート制限に到達。時間を空けて再送
- 送信後未表示: Strapi admin role permissions / collection filter を確認

## 運用基盤強化（2026-04-17 反映）
- 管理API追加: `GET /api/inquiry-submissions/ops/summary`, `GET /api/inquiry-submissions/ops/list`, `GET /api/inquiry-submissions/ops/export.csv`, `PATCH /api/inquiry-submissions/ops/bulk-update`
- 追加項目: `priority`, `internalTags`, `replyStatus`, `repliedAt`, `lastActionAt`, `spamFlag`, `attachmentCount`, `attachmentMetadata`
- 通知メール: `INQUIRY_NOTIFY_TO` が設定されていれば新規問い合わせ時に管理通知
- 自動返信: `INQUIRY_ENABLE_AUTO_REPLY=true` の場合のみ有効（spam/restockは対象外）
- 重複payload判定・URL比率判定・拡張子チェックを追加

## 競合解消メモ（PR #126 向け）
- 競合対象ファイルは `main` 側の最新実装（About 改修で追加された i18n キーを含む）を採用しつつ、Formspree 撤去後の問い合わせ送信実装を維持する。
- 解消時は `frontend/src/modules/contact/lib/submit.ts` の Strapi 投稿経路（`/api/inquiry-submissions/public`）が残っていることを必ず確認する。
- `frontend/src/locales/{ja,en,ko}/common.json` は連絡フォーム系キーと About ページ系キーの双方が欠落していない状態を正とする。

