# store / fc 編集運用基盤（CMS）整備ガイド

## 1. 現状確認結果（詰まりやすい箇所）

### 1-1. 既存 Strapi / CMS
- `store-product` と `fanclub-content` は `draftAndPublish: true` で、`featured/pickup/weeklyHighlight/displayPriority/startAt/endAt/heroCopy/heroVisual/ctaText/ctaLink` など主要運用項目は既に保持している。
- `site-setting` は single type として `topPageSections`（JSON）・ヒーロー文言・お知らせ導線を持つ。
- ただし、トップページ構成はフロント側にハードコードが残っており、CMS値が十分反映されていなかった。

### 1-2. ハードコード依存
- `storefront/StorefrontHomePage.tsx` と `fc/FanclubSitePages.tsx` で、ヒーロー文言・セクション表示・今週更新導線の定義が固定値中心。
- FC側の「今週更新」は静的な説明が多く、`weeklyHighlight` の実データ運用との乖離が発生しやすい。

### 1-3. 公開事故リスク
- `startAt/endAt` の前後不整合を CMS 保存時に抑止するガードが弱い。
- CTA が片側（text/link）のみ設定される事故を保存時に検知できない。
- SEO/OG 設定と実際の画像設定不整合を編集時に見落としやすい。

### 1-4. preview / 公開予約
- `/preview` 導線は存在するが、`store-product` タイプの遷移が未対応だった。
- 予約公開は Strapi の `publishAt` と本実装の `startAt/endAt` を組み合わせる必要があり、運用ルール明文化が不足。

---

## 2. 今回追加した運用基盤

### 2-1. 共通基盤
- `frontend/src/lib/editorial.ts` を追加し、以下を共通化。
  - 表示期間判定（`startAt/endAt`）
  - `topPageSections` JSON パース
  - サイト別（store/fanclub）セクション表示判定

### 2-2. store 運用改善
- Store トップで `site-setting` のヒーロー項目（title/subtitle/copy/CTA）を反映。
- `topPageSections` により、主要セクションの表示可否を CMS 側で制御可能化。
  - pickup
  - bento
  - spotlight
  - new arrivals
  - collections
  - weekly update
  - member pickup
  - featured
  - news/support

### 2-3. fc 運用改善
- FC トップで `site-setting` のヒーロー項目を反映。
- `fanclub-content` の `weeklyHighlight` + `displayPriority` + `startAt/endAt` から「今週更新」ダイジェストを自動生成。
- `topPageSections` により FC トップの主要ブロックを CMS 制御可能化。

### 2-4. 品質チェック / 入力ガード
- `store-product` lifecycle に以下を追加。
  - `startAt > endAt` の保存拒否
  - CTA 片側入力警告
  - `heroCopy` + `heroVisual` 不整合警告
  - SEO入力時 OGP未設定警告
  - `displayPriority` 過大値警告
- `fanclub-content` lifecycle を新規追加し、同等の編集ガードを導入。

### 2-5. preview
- `/preview` の type 解決に `store-product` を追加。

### 2-6. editor dashboard / publish audit（internal admin）
- `GET /api/internal/editorial/dashboard` を追加し、`news-item / blog-post / event / store-product / fanclub-content / campaign / guide / faq` の編集状態を横断集計できるようにした。
- 返却データで以下を分離表示する。
  - `draft / in_review / approved / scheduled / published / rolled_back`
  - `locale_pending`
  - `seo_incomplete`
  - `media_incomplete`
  - `failed schedule`（scheduled だが予定時刻超過かつ未公開）
- `frontend/src/pages/internal/InternalAdminPage.tsx` に editorial summary セクションを追加し、review queue / approval queue / scheduled queue / publish audit を一画面で確認できるようにした。
- publish audit は `internal_audit_log`（targetType: content 系）を参照し、who / what / when を追跡可能。

### 2-7. role-based approval の運用整理（暫定）
- Strapi の publish 権限だけでなく、internal admin 上の queue を運用基準にして「公開できる」と「公開してよい」を分離。
- 推奨責務:
  - editor: draft 更新・review 依頼
  - reviewer: review / changes requested / approved 判断
  - publisher: schedule / publish / rollback 実行
  - admin: bypass が必要な緊急操作のみ実行（必ず監査ログ理由付き）

---

## 3. `topPageSections` 運用ルール（JSON）

`site-setting.topPageSections` に以下形式で投入する。

```json
[
  {
    "key": "store-home-pickup",
    "site": "store",
    "enabled": true,
    "priority": 100,
    "locale": "ja",
    "startAt": "2026-04-10T00:00:00.000Z",
    "endAt": "2026-05-10T23:59:59.000Z"
  },
  {
    "key": "fc-home-weekly-update",
    "site": "fanclub",
    "enabled": true
  }
]
```

- `key`: セクション識別子（実装済みキーのみ有効）
- `site`: `store` / `fanclub` / `all`
- `enabled`: false で非表示
- `locale`: 指定時は該当ロケールのみ有効
- `startAt/endAt`: 期間外は自動で非表示

---

## 4. 公開予約 / 表示期間ガイド

1. 下書きで作成（Draft）。
2. `publishAt` を予約日時に設定（Strapi側の予約公開）。
3. さらに表示期間が必要な施策は `startAt/endAt` を設定。
4. 期限型施策は `endAt` を必ず設定。
5. `topPageSections` でトップ導線の出し分け期間を合わせる。

推奨:
- コンテンツ自体の公開: `publishAt`
- UI導線の表示制御: `startAt/endAt` + `topPageSections`

---

## 5. 多言語運用ガイド（ja/en/ko）

- `site-setting` はロケール別値を前提にし、ヒーロー文言・CTAは各ロケールで登録。
- `topPageSections.locale` を使う場合、未指定ロケールへのフォールバックは「未設定=全ロケール」扱い。
- FC「今週更新」は `getFanclubList(locale=現在言語)` で取得されるため、翻訳未投入時は表示候補が減る。

---

## 6. 公開前チェックリスト

- [ ] `startAt/endAt` が逆転していない
- [ ] CTA text/link がペアで入力されている
- [ ] Hero copy を差し替えたら Hero visual も確認した
- [ ] SEO を入力したら OGP画像も設定した
- [ ] `topPageSections` の key/site/locale が意図どおり
- [ ] `/preview?type=store-product|fanclub-content` で導線確認
- [ ] ja/en/ko でヒーロー文言崩れがない
- [ ] ライト/ダークで可読性が維持される

---

## 7. よくある運用ミスと回避

- ミス: 施策終了後に特集を消し忘れる
  - 回避: `endAt` を必須運用にする
- ミス: リンク先未設定の CTA を公開
  - 回避: lifecycle 警告 + 公開前チェックでダブル確認
- ミス: ロケール更新漏れ
  - 回避: `locale` ごとに preview 実施
- ミス: priority 競合で意図しない表示順
  - 回避: 高優先度値をルール化（例: 100刻み）

---

## 8. 計測イベント（既存 tracking 活用）

今回の運用基盤は既存イベント群の継続利用を前提。

- ヒーローCTA: `store_home_hero` / `fc_home`
- 特集クリック: `store_home_spotlight` / `fc_home_spotlight`
- pickup: `store_home_pickup`
- 今週更新: `store_home_digest` / `fc_home_digest`
- Join/Login: `fc_home`, `fc_login`, `fc_join`
- Store/FC回遊: `fc_home_store_bridge`, `store_home_member_pickup`
- AnnouncementBar: `subdomain_announcement_click`, `subdomain_weekly_highlight_click`
