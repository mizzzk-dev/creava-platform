# コミュニティ参加基盤 / UGC / モデレーション基盤 実装メモ（2026-04-18）

## 0. 目的
main / store / fc を横断して「閲覧中心」から「参加中心」へ段階的に移行するため、**安全運用可能な最小参加機能**（reaction・参加ログ・短文UGC・通報・モデレーション記録）を追加した。

## 1. 現状調査サマリ（実装前）

### 1-1. 既存導線の確認
- auth / mypage: Logto 前提の `useCurrentUser` と `/mypage` 導線あり。
- favorites / history / notifications / loyalty: localStorage + 一部 Strapi モデルで土台あり。
- Event / News / Guide / FAQ / Product / FC 回遊: discovery 基盤・support 基盤・campaign 基盤が整備済み。
- コメント / reaction / UGC: 本格実装なし（favorite はあるが感情表現・投稿文脈は不足）。
- 通報 / moderation: inquiry・ops系はあるが、UGC向け report / moderation queue は不足。
- accessLevel / 公開制御: `accessStatus(public/fc_only/limited)` は既存コンテンツで運用済み。
- analytics: sourceSite / locale / theme 付きの計測基盤あり。

### 1-2. 現在の参加体験課題
1. コンテンツ詳細で「次の参加行動」が不足（favorite のみ）。
2. Event 参加意向（興味あり/参加予定/参加済み）を残せない。
3. FC の会員価値が閲覧中心で、参加履歴の可視化が弱い。
4. UGC 導線がないため、継続率・再訪率を押し上げる仕組みが弱い。
5. 通報・承認待ち・非表示の共通ステータスモデルが未整備。

### 1-3. main / store / fc ごとの不足
- main: Event/News への軽い参加導線が不足。
- store: Product 文脈での参加（応援・期待・投稿）が不足。
- fc: 会員限定での感想投稿・承認待ち運用が不足。

### 1-4. UGC・reaction を入れやすい箇所
- `EventDetailPage`（参加予定と感想の文脈が明確）
- `FanclubDetailPage`（会員参加導線を作りやすい）
- `StoreDetailPage`（レビューより軽い反応の導線を配置しやすい）

### 1-5. モデレーション必要箇所
- 短文投稿（誹謗中傷・権利侵害）
- 投稿通報（レビューキュー）
- 表示制御（pending_review / hidden / rejected）

### 1-6. 安全に始める最小機能
- リアクション（応援/気になる/参加したい）
- Event 参加意向
- 280文字の短文投稿（ログイン必須）
- 通報ボタン
- moderationStatus / reportStatus を持つモデル
- analytics イベント追加

### 1-7. 作業ブランチ名案
- `community-participation-foundation`（採用）

### 1-8. 実装順
1) 情報設計（型・status）
2) フロント参加UI
3) local 保存 + analytics
4) Strapi モデル拡張
5) docs / runbook 追記

## 2. 参加体験の情報設計
共通概念として以下を導入した。
- participationType
- reactionType
- sourceSite
- contentType
- entityId
- visibility
- accessLevel
- moderationStatus
- reportStatus
- featuredCommunityPost
- engagementScore
- eventParticipationState
- locale

補足: `participationBadge`, `userContributionType`, `userRole` は次PRで profile / loyalty と統合予定。

## 3. リアクション / 参加ログ基盤
- `frontend/src/modules/community/types.ts` で型を定義。
- `storage.ts` で以下を実装。
  - reaction 集計保存
  - participation log 保存
  - event participation state 保存
  - analytics 送信 (`reaction_add`, `event_participation_mark`, `participation_intent_click`)

## 4. UGC / 投稿導線
- `CommunityEngagementPanel` を作成。
- ログインユーザーのみ投稿可能（280文字）。
- 投稿は `pending_review` / `visibility=pending_review` で保存。
- 投稿一覧（直近3件）と通報ボタンを表示。

## 5. Event 連動 / 参加記録
- Event 詳細で「興味あり / 参加予定 / 参加済み」を即時記録。
- 将来の mypage participation history 連携に備え `participation-log` モデルを追加。

## 6. モデレーション / 通報 / 公開範囲管理
追加モデル:
- `community-post`
- `community-report`
- `moderation-log`
- `community-reaction`
- `participation-log`

運用ステータス:
- moderationStatus: `draft / pending_review / published / hidden / rejected / archived / reported`
- reportStatus: `open / in_review / resolved / rejected`

## 7. main / store / fc 横断導線強化
- `EventDetailPage` / `StoreDetailPage` / `FanclubDetailPage` に共通パネルを配置。
- サイトごとの `sourceSite` を保持し、横断比較できるよう統一。

## 8. analytics / 計測
追加イベント:
- `reaction_add`
- `participation_intent_click`
- `event_participation_mark`
- `ugc_create_start`
- `ugc_submit_success`
- `report_submit`

共通付与:
- `sourceSite`, `contentType`, `entityId`, `userState`, `eventParticipationState`（該当時）

## 9. Strapi / backend / API 拡張
- 新規 content-type を `backend/src/api/*` に追加。
- すべて core controller/service/router で最小構成。
- 既存 route/slug/endpoint は変更せず追加のみ。

## 10. docs / env / 運用
- 本ドキュメントを追加。
- 追加SaaS: なし。
- GitHub Secrets / Variables: 現時点で追加不要。
- DNS: **変更不要**（既存 main/store/fc 配下で運用）。
- local/stg/prod 差分: moderation 運用ルール（権限/承認者）のみ環境ごとに要確認。

## 11. 動作確認（今回）
- frontend lint
- frontend build
- backend build

## 12. 追加 / 修正ファイル一覧
- frontend
  - modules/community/*
  - pages(EventDetail/FanclubDetail/StoreDetail)
  - locales ja/en/ko
  - lib/api/endpoints.ts
- backend
  - community-reaction
  - participation-log
  - community-post
  - community-report
  - moderation-log
- docs
  - 本ドキュメント

## 13. 残課題
1. Strapi 認証ユーザーと userId を authoritative に紐付ける。
2. 投稿の編集/削除/下書きAPIを追加する。
3. 管理画面に moderation queue 専用ビューを追加する。
4. 画像添付の著作権・肖像権フローを追加する。
5. mypage の participation history UI と loyalty バッジ連携。

## 14. PR本文案（日本語）
```yaml
type: feature
priority: high
areas:
  - community
  - ugc
  - engagement
  - moderation
  - frontend
  - backend
  - cms
  - docs
labels:
  - feature
  - community
  - ugc
  - engagement
  - moderation
  - frontend
  - backend
  - cms
review_points:
  - 参加導線が自然で継続価値につながるか
  - UGC やリアクションが安全に運用できるか
  - main / store / fc 横断導線が自然か
  - visibility / accessLevel / moderation が適切か
  - 多言語 / テーマ / モバイルが壊れていないか
  - analytics で参加施策の効果測定ができるか
risks:
  - UGC 導入によるモデレーション負荷増加
  - 通報 / 承認フロー不足による荒れ
  - participation 導線過多によるUI複雑化
not_done:
  - 必要なら次PRで高度なコミュニティ機能やランキングを追加
```

上記に続けて、実装差分と確認手順を本文に記載して提出する。

## 15. 仮定
- 認証済み userId が frontend から安全に取得できる前提で local 保存を先行した。
- community API の本番公開権限は Strapi 管理画面で運用設定する前提。
- 投稿画像添付は第一弾の対象外として設計した。
