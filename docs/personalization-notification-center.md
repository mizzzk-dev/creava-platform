# パーソナライズ導線（お気に入り / 閲覧履歴 / 通知センター）運用メモ

更新日: 2026-04-18

## 1. 目的
- main / store / fc を横断して「戻ってくる理由」を作る。
- お気に入り / 履歴 / 通知をマイページの再訪導線に統合する。
- 将来のメール通知 / push 通知に拡張しやすいデータ構造を用意する。

## 2. 保存方針

### お気に入り
- 未ログイン: `localStorage`（`creava.personalization.favorites`）へ保存。
- ログイン: 同一構造で userId 付与し、将来 `favorites` API へ同期。
- 対象: product / fanclub / news / blog / event / guide / faq。

### 閲覧履歴
- 未ログイン: `localStorage`（`creava.personalization.history`）へ最大60件保存。
- ログイン: userId 付与して将来 `view-histories` API と同期。
- 保存量は上限を設定し、重複は上書き更新する。

### 通知センター
- 現在はアプリ内通知のみ（`localStorage`: `creava.personalization.notifications`）。
- `isRead`, `priority`, `sourceSite`, `category`, `href` を保持。
- 将来は `member-notifications` API と連携し、メール/push を後付けする。

## 3. Strapi/CMS 追加モデル
- `favorite` (`/api/favorites`)
- `view-history` (`/api/view-histories`)
- `member-notification` (`/api/member-notifications`)

運用項目:
- sourceSite（main/store/fc）
- locale
- priority / visibility
- read status（通知）

## 4. GitHub Secrets / Variables
- 今回の追加機能では新規 Secret は **不要**。
- 既存の `VITE_STRAPI_API_URL`, `VITE_LOGTO_*` を継続利用。

## 5. 環境差分
- local: localStorage で即時動作。
- staging/prod: API 接続時に `favorites/view-histories/member-notifications` を公開ロール/認証ロールに応じて制御。

## 6. DNS 変更
- DNS 変更は **不要**（既存 main/store/fc ドメイン内で完結）。

## 7. 管理画面運用手順（最小）
1. Strapi 管理画面で `favorite/view-history/member-notification` の権限を設定。
2. 公開ロールは原則 read のみ、書き込みは認証ユーザー経由 API に制限。
3. 通知は `priority=high` を重要通知として運用。

## 8. トラブルシューティング
- 症状: 保存されない
  - 対処: ブラウザ storage 制限/シークレットモードを確認。
- 症状: 通知既読が反映されない
  - 対処: localStorage キーの破損を疑い、該当キー削除後に再操作。
- 症状: ログイン後に未ログインデータが見えない
  - 対処: userId 連携 API 実装後にマージ処理を有効化（現状は構造のみ準備）。

## 9. 残課題
- API 同期（双方向マージ）
- 通知配信チャネル（email/push）
- レコメンドアルゴリズムの精緻化
