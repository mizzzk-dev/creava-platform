# CMS運用マニュアル（編集ワークフロー / 予約公開 / プレビュー / 承認 / アーカイブ）

- 更新日: 2026-04-18
- 対象: Strapi運用者（編集担当 / 確認担当 / 公開担当）
- 目的: 公開事故・翻訳漏れ・表示漏れ・期限切れ放置を減らし、main/store/fc/support を継続運用しやすくする
- 前提: Strapi管理画面アクセス権あり
- 関連ドキュメント:
  - [DB設計書](../06_database/database-design.md)
  - [環境変数設定手順書](../10_appendix/environment-variables.md)

---

## 1. 現状調査まとめ（今回の改善前提）

### 1-1. 現在の Strapi content types / Draft & Publish
- `news-item`, `event`, `guide`, `faq`, `campaign`, `store-product`, `fanclub-content`, `blog-post` は `draftAndPublish: true`。
- 既存運用は「draft保存 → 手動publish」が中心で、レビュー状態の明確な区分が弱い。

### 1-2. 公開事故が起きやすい箇所
- `featured/pickup/displayPriority` が同時に強く設定されると、表示優先順位が競合しやすい。
- `startAt/endAt` の逆転や、`publishAt` と期間設定の不整合で「出るべきでない時期に表示」事故が起きやすい。
- `CTA` と `SEO/OG` の片設定が見落とされやすい。

### 1-3. 翻訳漏れ / 表示漏れが起きやすい箇所
- `ja/en/ko` で更新対象が多く、ロケール網羅率の可視化がなかった。
- locale別プレビューが運用ルール依存で、確認漏れが出やすい。

### 1-4. 予約公開 / アーカイブが弱い箇所
- `publishAt` と `startAt/endAt` の役割整理が明文化不足。
- 期限後の `expired` / `archived` 運用の切替条件が揺れやすい。

### 1-5. preview / approval が必要な箇所
- Hero / FAQ / Guide / News / Event / Product / FC投稿 / Campaign は、公開前に導線と表示を検証する必要が高い。
- 承認記録（誰がいつ承認したか）がなければ、差し戻し時に追跡が困難。

---

## 2. コンテンツライフサイクル（必須状態）

全対象で `editorialWorkflowStatus` を次の状態で運用する。

1. `draft`
2. `review_pending`
3. `approved`
4. `scheduled`
5. `published`
6. `archived`
7. `expired`

### 2-1. 状態遷移ルール
- `review_pending` へ進めるときは `reviewComment` 必須（確認観点を残す）。
- `approved/scheduled/published` へ進めるときは `approvedBy` と `approvedAt` 必須。
- `scheduled` は `scheduledPublishAt` または `publishAt` 必須。
- `archived` は `archiveAt` 必須。

### 2-2. 役割分担
- 編集担当: `draft` 作成、本文・画像・関連導線入力。
- 確認担当: `review_pending` で品質確認、差し戻しコメント。
- 公開担当: `approved` を `scheduled/published` に移行。

---

## 3. 予約公開 / 期間表示制御

### 3-1. 項目の責務
- `publishAt`: コンテンツ公開日時（Strapi公開制御）。
- `scheduledPublishAt`: 運用上の予約公開管理日時（承認後の予約チェック用）。
- `startAt/endAt`: UI露出期間（特集・Pickup・Campaignなど）。
- `archiveAt`: アーカイブ化日時。

### 3-2. 安全ルール
- `startAt <= endAt` を必須化（逆転保存はエラー）。
- `publishAt <= endAt`、`scheduledPublishAt <= endAt` を検証。
- 期限施策は `endAt` を必須運用。
- 期限後は `expired` か `archived` に移し、表示しっぱなしを防ぐ。

---

## 4. preview 基盤

### 4-1. プレビューURL
- `GET /preview?secret=...&type=...&slug=...&locale=ja|en|ko&theme=light|dark`

### 4-2. 仕様
- `secret` 検証後に preview モードを有効化。
- `locale` 指定がある場合、遷移前に言語切替。
- `theme` 指定がある場合、`light/dark` を localStorage へ反映。
- `news-item/blog-post/work/event/fanclub-content/store-product/campaign/guide` に対応。

---

## 5. 承認フロー / quality check

### 5-1. 追加管理項目
- `editorialChecklist`（JSON）
- `reviewComment`
- `approvedBy`
- `approvedAt`
- `qualityWarnings`
- `qualityScore`

### 5-2. 自動チェック（保存時）
- title / slug / CTA / SEO / OG / canonical / locale網羅率。
- `featured/pickup/displayPriority` 競合の警告。
- quality snapshot（`qualityWarnings`, `qualityScore`）を自動更新。

---

## 6. 多言語運用（ja/en/ko）

### 6-1. 管理方針
- `translationCoverage`（JSON）で言語ごとの完了状態を管理。
- `ja` だけ更新されるケースを `qualityWarnings` で警告。
- locale別プレビューを公開前チェックリストに必須化。

### 6-2. fallback 方針
- 表示は既存の i18next fallback を維持。
- ただし運用上は fallback に依存せず、`translationCoverage` を埋めること。

---

## 7. アーカイブ / 再利用 / 特集量産

- `archived/expired` を明示状態として扱い、期限超過コンテンツを棚卸ししやすくする。
- `related*` relation と `editorialChecklist` をテンプレート化し、特集ページの再利用を促進。
- `campaign`, `store-product`, `fanclub-content` で期間施策を共通思想で運用する。

---

## 8. Strapi/admin UI 運用ルール

一覧で次を常時確認する。
- `editorialWorkflowStatus`
- `locale` / `translationCoverage`
- `publishAt` / `scheduledPublishAt`
- `startAt` / `endAt` / `archiveAt`
- `featured` / `pickup` / `displayPriority`
- `qualityScore` / `qualityWarnings`

推奨フィルタ:
- `review_pending`, `scheduled`, `expired`, `archived`
- `qualityScore < 80`
- `translationCoverage` 未完了

---

## 9. main / store / fc / support 更新ルール

- **main**: News / Event / Guide / FAQ / 特集は `review_pending` と preview を必須化。
- **store**: Product / Campaign は `scheduledPublishAt` と `endAt` をセットで運用。
- **fc**: FC投稿は `accessStatus` と `editorialWorkflowStatus` の両方を確認。
- **support**: FAQ/Guide は `relatedForms` と `sourceSite` の整合を確認。

---

## 10. 運用ミスと回避

1. 予約公開したが期限設定なし
   - 回避: `scheduled` は `endAt` 必須運用。
2. 翻訳漏れで一部導線だけ日本語
   - 回避: `translationCoverage` が 3言語完了になるまで publish しない。
3. 露出優先度の競合
   - 回避: `featured/pickup/displayPriority` の同時高値を避ける。

---

## 11. 環境変数 / Secrets / DNS

- `VITE_PREVIEW_SECRET`（frontend）と同値を Strapi preview 側にも設定。
- 追加SaaSは不要（既存Strapi + frontend構成で運用）。
- `mizzz.jp / store.mizzz.jp / fc.mizzz.jp` 内で完結するため、**DNS変更は不要**。
