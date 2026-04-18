# Logto Account Center / マイページ設定ハブ実装メモ（2026-04-18）

- 更新日: 2026-04-18
- 対象: `mizzz.jp` / `store.mizzz.jp` / `fc.mizzz.jp`
- 目的: 「見るだけのマイページ」から「自己解決できるアカウント管理導線」へ段階移行する

## 1. 現在のアカウント管理課題（調査結果）

1. main / store / fc それぞれで login/logout/callback はあるが、**アカウント設定導線が画面上で明示されていない**。
2. `/member` は profile / payment / shipping / notification が中心で、**security settings と sessions の導線が弱い**。
3. social provider 表示はあるが、**linked identity 管理画面への案内が不足**。
4. support での「不審ログイン」対応が「再ログインしてください」に寄りやすく、**セッション revoke の自己解決導線が不足**。
5. env/docs で `VITE_LOGTO_ACCOUNT_CENTER_URL` の責務が定義されておらず、**運用時に URL の置き場所が不明瞭**。

## 2. Hosted Account Center を使う箇所

security-sensitive 項目は prebuilt の Hosted UI を優先:

- password 変更
- MFA の有効化/解除
- passkey 管理
- active sessions 一覧 / revoke
- linked accounts（social identities）

理由:

- 認証強度・検証フロー・将来仕様変更の追従を Logto 側で担保できる。
- mizzz 側は表示/UIの責務を最小化し、運用コストと事故リスクを下げられる。

## 3. custom UI にする箇所

`/member`（main/store/fc 共通）に設定ハブを置き、以下を custom UI で扱う:

- 設定カテゴリの案内（プロフィール/セキュリティ/セッション/連携アカウント）
- 通知設定（NotificationPreferenceCenter）
- CRM 配信設定・会員動線・support FAQ/Contact 導線
- 「この設定はどこで変えるか」の補助説明

方針: **設定の実体は Logto、導線・文脈は mizzz**。

## 4. session / MFA / passkey / linked account の不足と対応

### 不足
- sessions を UI で辿れるが明示導線が弱かった。
- MFA / passkey の位置づけ説明がなかった。
- linked account の運用（誤統合リスク）を support へ接続できていなかった。

### 今回の対応
- `/member` に Account Center ハブを追加し、以下を外部遷移で明確化。
  - profile
  - security
  - sessions
  - identities
- docs に support 観点のセッション対応手順を追記。
- env/docs に Account Center URL 管理を追加。

## 5. support 負荷が高くなりやすい箇所

1. メール/ソーシャル重複登録による「別アカウント化」
2. session 不審アクセスの初動対応
3. passkey / MFA 未導入状態でのアカウント復旧
4. custom domain と account center URL の環境差分ミス

運用ポリシー:

- 即時の管理者統合より先に本人確認プロセスを実施。
- セッション終了・パスワード変更・MFA有効化を一連で案内。

## 6. env / docs / runbook の整備

- frontend env に `VITE_LOGTO_ACCOUNT_CENTER_URL` を追加。
- 環境変数手順書に Account Center URL と fallback 仕様を追記。
- Logto runbook に Hosted vs custom の責務分離、セッション対応手順、トラブルシュートを追記。

## 7. 実装順（今回の適用）

1. 現状調査（auth/mypage/notification/crm/docs）
2. Account Center 戦略決定（Hosted 優先）
3. `/member` 設定ハブ導線を追加
4. i18n（ja/en/ko）更新
5. env example / docs / runbook 更新
6. lint/build で回帰確認

## 8. DNS 変更要否

- 既に `auth.mizzz.jp` 運用済みの環境では **DNS変更不要**。
- 新規に custom domain を使う場合のみ CNAME 追加が必要。

## 9. 今後の拡張候補（次PR）

- Account API を用いた profile summary / session summary の read-only 表示強化
- 「この端末以外ログアウト」専用 CTA の導線強化
- MFA 方針（任意→高価値操作必須）への段階移行
- support 管理画面向け account recovery runbook のテンプレ化
