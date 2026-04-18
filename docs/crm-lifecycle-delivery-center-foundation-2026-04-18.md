# CRM / ライフサイクル配信 / セグメント通知 / 配信設定センター 基盤 (2026-04-18)

## 0. 目的
- main / store / fc 横断で、ユーザー状態に応じた配信土台を揃える。
- サイト内通知 + メール通知を優先し、追加SaaSなしで運用可能にする。
- 通知ノイズを抑えつつ、再訪率・継続率・回遊率を改善する。

## 1. 現在の再訪 / 継続施策課題（調査）
1. 通知設定が局所的（FC内の通知購読UIとマイページの簡易2項目）で、テーマ・チャネル別の一元管理がない。
2. favorites / history / notification は localStorage 基盤があるが、opt-in / opt-out と同一責務で扱えていない。
3. メール配信は問い合わせ運用（SMTP）に寄っており、ライフサイクル用途のテンプレ概念が不足。
4. analytics は notification イベントを計測可能だが、配信設定変更と再訪成果の紐づけ粒度が不足。

## 2. 通知や配信で不足している導線
- マイページからの配信設定センター導線。
- テーマ別（FC更新 / 会員特典 / ストア新着 / お気に入り / キャンペーン / イベント / 重要通知）のチャネル設定。
- unsubscribe / 法務導線と同一画面での説明。
- main / store / fc を横断した共通セグメント文脈。

## 3. main / store / fc ごとの有効シナリオ
- main: event_update / guide_update / campaign_announcement。
- store: favorite_related / store_new_arrival / inactivity_nudge。
- fc: fc_update / member_benefit / renewal_nudge。
- 共通: welcome / support_important_notice。

## 4. ノイズ化リスク箇所
- 同一テーマの短時間再送。
- 会員外ユーザーへの member 向け通知。
- support_important と任意通知の混同。

## 5. セグメント化条件（初期）
- `userState`, `membershipStatus`, `membershipPlan`, `sourceSite`, `locale`
- `favoriteCategories`, `recentViewedTypes`, `campaignEligibility`
- `notificationPreference`, `emailOptIn`, `inAppOptIn`
- `loyaltyState`, `engagementSegment`

## 6. 今回追加した機能一覧
- frontend
  - 配信設定センターUI（チャネル別 + テーマ別 + 一括ON/OFF + 必須通知表示）
  - 設定変更時 analytics (`notification_preference_open`, `notification_preference_update`, `email_opt_in/out`, `in_app_opt_in/out`, `unsubscribe_click`)
  - CRM セグメント型 / シナリオ判定ユーティリティ
- backend / Strapi
  - `notification-preference` モデル
  - `lifecycle-template` モデル
  - `delivery-log` モデル

## 7. 実装順
1. 既存通知・再訪導線調査
2. セグメント型定義
3. 配信設定センターUI追加
4. analytics連携
5. Strapiモデル追加
6. docs / env 更新

## 8. 運用ルール
- 必須通知 (`support_important`) は常時ON。
- 任意通知はチャネル単位 / テーマ単位で停止可能。
- throttle はテンプレ側 `throttleHours` で制御。
- idempotency は `delivery-log.idempotencyKey` で重複抑止。

## 9. env / Secrets / DNS
- SMTP は既存 runtime env を流用（`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`）。
- 追加SaaS・追加DNSは不要。
- GitHub Secrets の追加は必須ではない（既存SMTP・既存Strapiトークン前提）。

## 10. 動作確認手順
1. マイページで「配信設定センター」が表示されること。
2. In-App / Email 一括トグルがテーマ全体に反映されること。
3. 必須通知テーマが編集不可で表示されること。
4. locale 切替時に文言が切替わること。
5. dark/light で視認性が崩れないこと。
6. `npm run lint --prefix frontend` と `npm run build:frontend` が通ること。
7. `npm run build:backend` が通ること。

## 11. 残課題
- Strapi API と frontend preference の同期（現状は localStorage 優先）。
- 配信ジョブ実行（cron/queue）と SMTP 送信処理本体。
- unsubscribe token を使った公開停止エンドポイント。
- dormant / support intent の自動セグメント更新バッチ。

## 仮定
- 認証ID (`userId`) が全サイトで同一キーとして扱える前提。
- SMTP接続情報は既存環境で利用可能な前提。
- 既存 analytics 基盤は新規イベント名をそのまま受け入れ可能な前提。
