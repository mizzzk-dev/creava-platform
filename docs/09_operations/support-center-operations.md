# サポートセンター運用ガイド（FAQ / Guide / Contact / Case history 連携）

## 目的
- 問い合わせ前に自己解決できる導線を main / store / fc で共通整備する。
- FAQ（短答）と Guide（手順・詳細）を分離し、Strapi で継続運用できる状態を作る。
- Contact フォーム前に関連FAQ/Guideを提示し、問い合わせ件数の最適化を狙う。
- 問い合わせ後の case status / resolution state をユーザー・support 双方で追えるようにする。

## 現状課題（実装前監査）
1. FAQ は単一ページ中心で、sourceSite 単位の出し分けが弱い。
2. Guide は store/fc/main で分散し、検索や関連導線が不足。
3. Contact 前後で「自己解決導線」が不足し、フォーム直行になりやすい。
4. FAQ/Guide の管理項目が少なく、運用時の分類・関連付けがしづらい。

## 追加した情報構造
- 共通入口: `/support`（Support Center）
- FAQ 一覧: `/faq`
- Guide 詳細: `/support/guides/:slug`
- Contact 連携: `/contact` の各フォームに関連FAQ/Guideパネルを表示
- Case summary / history: `/api/inquiry-submissions/me/summary`, `/api/inquiry-submissions/me/history`
- Case detail / reopen: `/api/inquiry-submissions/me/:id`, `/api/inquiry-submissions/me/:id/reopen`
- 補助導線: FAQ/Guide の `featured`・更新日時を使った「注目」「最近更新」枠を表示
- クイックリンク: main/store/fc で policy/legal/news/events への到達をサポートセンター上部に固定

## support / case / resolution state の責務分離
- `status`: support ops 実務状態（new/in_review/waiting_reply/replied/closed）
- `caseStatus`: ユーザー向けケース進行状態（submitted/triaging/waiting_user/resolved/closed/reopened）
- `caseResolutionState`: 解決責務（unresolved/self_resolved/support_resolved/info_only/duplicate/escalated）
- `caseVisibilityState`: 可視範囲（private_user/support_only/internal_only/linked_article_only）
- `selfServiceState`: 自己解決段階（not_attempted/article_suggested/article_viewed/self_resolved/still_need_support）

> 重要: `auth.users` は認証専用。support case の実データは `inquiry-submission` と app-user を参照して管理する。

## Strapi コンテンツモデル

### FAQ（拡張）
- 主要項目: `question`, `answer`, `locale`, `category`, `subcategory`, `sourceSite`, `tags`
- 関連項目: `relatedGuides`, `relatedForms`, `relatedProducts`, `relatedEvents`, `relatedNews`, `relatedFCContent`
- 表示制御: `sortOrder`, `featured`, `isPublic`, `displayPriority`
- 検索用: `keywords`, `slug`, `seoTitle`, `seoDescription`

### Guide（新規）
- 主要項目: `title`, `summary`, `body`, `locale`, `category`, `sourceSite`, `tags`, `coverImage`
- 関連項目: `relatedFAQs`, `relatedForms`, `relatedProducts`, `relatedEvents`, `relatedNews`, `relatedFCContent`
- 表示制御: `featured`, `displayPriority`, `slug`
- SEO: `seoTitle`, `seoDescription`

## sourceSite ごとの表示ルール
- `sourceSite=all`: 全サイトで表示
- `sourceSite=main`: main のみ表示
- `sourceSite=store`: store のみ表示
- `sourceSite=fc`: fc のみ表示

## FAQ / Guide 追加手順
1. Strapi 管理画面で FAQ または Guide を作成。
2. `sourceSite` を設定（all/main/store/fc）。
3. `category` と `tags` を設定。
4. Contact導線に出す場合は `relatedForms` に formType を追加（例: `contact`, `request`, `store_support`, `fc_support`）。
5. 必要に応じて `relatedProducts` / `relatedEvents` / `relatedNews` / `relatedFCContent` を紐付け。
6. `featured` / `displayPriority` で表示優先度を調整。

## カテゴリ追加手順
1. Strapi 側の enum/string 設計と整合する値を決める。
2. フロント側のカテゴリラベル（i18n）と `modules/support/config.ts` を更新。
3. Support Center / FAQ / Contact 前導線の検索・絞り込みで確認。

## 多言語更新手順
- `frontend/src/locales/{ja,en,ko}/common.json` の `support` キーを同時更新。
- FAQ/Guide 本文は Strapi locale または運用ルールに従って各言語を登録。

## 問い合わせ導線接続ルール
- フォーム表示時に、`sourceSite` と `formType` を条件に関連FAQ/Guideを表示。
- 解決しない場合はフォーム入力を継続。
- 送信成功/失敗画面でも Support Center・FAQ・Guide への再遷移導線を出す。
- ログイン済みユーザーは support center 上で case summary / case history を参照できる。
- `resolved` / `closed` case はユーザーが再オープン可能（`reopen`）だが、raw ops log は非公開。

## RLS / access 境界（実装方針）
- ユーザー履歴APIは Bearer token 必須（Supabase Auth / 統一 Auth）。
- my history は `authUserId` と `app-user.email` をキーに自身ケースへ限定。
- `spamFlag=true`、`caseVisibilityState=internal_only|support_only` はユーザー履歴に含めない。
- support/internal の一括更新・CSV export は `INQUIRY_OPS_TOKEN` 保護を継続。

## 計測イベント（support hub）
- `support_center_view`
- `help_hub_view`
- `article_suggestion_view`
- `article_suggestion_click`
- `still_need_help_click`
- `case_reopen_click`
- （既存）`support_from_notification_center`, `support_from_account_center`

## 検索/絞り込み運用ルール
- Support Center の検索対象:
  - FAQ: `question`, `answer`, `tags`, `keywords`
  - Guide: `title`, `summary`, `body`, `tags`
- 0件時の対応:
  - キーワード/カテゴリのリセット導線を表示
  - それでも解決しない場合の Contact 導線を表示
- カテゴリ値は `modules/support/config.ts` と Strapi enum を一致させる（旧キーを混在させない）

## 内容更新の優先順位
1. 問い合わせ頻度の高いトピック（注文/配送/ログイン/決済）
2. 直近の不具合・障害で増えた問い合わせ
3. Store/FC の購入・会員維持に関わる導線
4. main の一般問い合わせ前チェック

## FAQ化すべき問い合わせの判断基準
- 同一主旨の問い合わせが月2回以上発生
- 手順誤解で発生する問い合わせ
- 法務・決済・解約など高リスク領域
- CS対応で定型文返信が増えている内容

## よくある運用ミスと回避
- ミス: sourceSite 未設定で他サイトに露出
  - 回避: 公開前に sourceSite / category / isPublic を確認
- ミス: relatedForms 未設定で Contact前導線に出ない
  - 回避: formType 一覧（contact/request/store_support/fc_support）をテンプレ管理
- ミス: 多言語片側のみ更新
  - 回避: ja/en/ko 同時チェックをPRレビュー項目化

## env / Secrets / DNS
- frontend env:
  - `VITE_SUPPORT_CENTER_HISTORY_PAGE_SIZE`
  - `VITE_SUPPORT_CENTER_SUGGESTION_MAX`
- backend env:
  - `INQUIRY_MY_HISTORY_PAGE_MAX`
  - `INQUIRY_MY_SUMMARY_MAX_ROWS`
- 既存必須:
  - `SUPABASE_JWT_ISSUER`, `SUPABASE_JWKS_URI`, `SUPABASE_JWT_AUDIENCE`
  - `INQUIRY_OPS_TOKEN`
- GitHub Secrets / Variables:
  - runtime の secret は backend 側（service role / ops token）に限定し、frontend には `ANON_KEY` のみを配布
- DNS: **変更不要**（既存ドメイン配下のルート追加のみ）
- local / staging / production 差分: 既存 `VITE_SITE_TYPE` と Strapi 接続先差分のみ

## よくある問い合わせをFAQ化する運用優先順位（site別）
- main: 一般問い合わせ前確認 / event / profile・活動 / news導線
- store: 注文 / 決済 / 配送 / 返品交換 / デジタル商品 / エラー
- fc: 会員登録 / ログイン / 決済 / 特典 / 解約 / 会員限定閲覧
