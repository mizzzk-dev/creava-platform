# フォーム運用マニュアル（本番運用レベル）

- 更新日: 2026-04-17
- 対象: main / store / fc の問い合わせ運用担当、CMS運用担当
- 目的: 問い合わせの受付〜判定〜返信〜記録〜エクスポートを安定運用する

## 1. 現在のフォーム運用課題（移行後ギャップ）

1. 保存はできるが、運用優先度（priority）と返信状態（replyStatus）が弱く、実務の追跡がしづらい。
2. 一覧運用で必要な「添付あり/なし」「期間指定」「CSV出力」の導線が弱い。
3. 通知メール・自動返信が任意実装で、見逃し防止が運用依存になりやすい。
4. スパム対策が honeypot + 基本バリデーション中心で、連投・重複 payload 監視が不足しやすい。
5. 将来フォーム（応募/エントリー等）への横展開を見据えた `formType` 拡張性が不足していた。

## 2. データモデル強化

`Inquiry Submission` は以下を追加・強化:
- `priority` (`low/normal/high/urgent`)
- `internalTags`（内部タグ配列）
- `replyStatus` (`not_required/pending/replied/failed`)
- `repliedAt`
- `lastActionAt`
- `spamFlag`
- `attachmentCount`
- `attachmentMetadata`
- `status` に `waiting_reply` を追加
- `formType` を将来拡張（`application`, `entry`, `collaboration`）

## 3. 管理ダッシュボード運用（Strapi Admin）

### 3.1 一覧で確認する列（推奨）
- `submittedAt`, `status`, `priority`, `sourceSite`, `inquiryCategory`, `locale`, `attachmentCount`, `email`

### 3.2 詳細で更新する項目
- `status`, `priority`, `adminMemo`, `internalTags`, `handler`
- `replyStatus`, `repliedAt`
- `sourceSite`, `sourcePage`, `locale`
- `attachmentMetadata`

### 3.3 未対応数と日次/週次件数
- API: `GET /api/inquiry-submissions/ops/summary`
- 認証: `x-inquiry-ops-token: $INQUIRY_OPS_TOKEN`

## 4. 通知メール / 自動返信

### 4.1 管理通知（新規問い合わせ）
- 条件: `INQUIRY_NOTIFY_TO` 設定時
- 内容: `sourceSite`, `inquiryCategory`, `attachmentCount`, `subject`, `message` など
- 重要: メール送信に失敗しても submission 保存は成功させる（ログのみ）

### 4.2 自動返信
- `INQUIRY_ENABLE_AUTO_REPLY=true` の時のみ有効
- spam / restock は自動返信対象外
- ja/en/ko の簡易テンプレートを切替
- 返信目安文言は `INQUIRY_REPLY_SLA_DAYS` で調整可能

## 5. 検索 / 絞り込み / 並び替え / CSV

### 5.1 一覧API
`GET /api/inquiry-submissions/ops/list`
- フィルタ: `status`, `sourceSite`, `inquiryCategory`, `locale`, `priority`, `formType`, `hasAttachment`, `spamFlag`, `dateFrom`, `dateTo`, `q`
- 並び替え: `sortBy=submittedAt|updatedAt|priority|status`, `sortOrder=asc|desc`

### 5.2 CSV エクスポート
`GET /api/inquiry-submissions/ops/export.csv`
- 一覧APIと同じフィルタを利用可能
- 出力項目:
  - `id`, `submittedAt`, `status`, `priority`, `sourceSite`, `sourcePage`, `locale`, `inquiryCategory`, `formType`
  - `name`, `companyOrOrganization`, `email`, `phone`, `subject`, `message`, `attachmentCount`, `spamFlag`, `handler`, `repliedAt`

### 5.3 一括更新
`PATCH /api/inquiry-submissions/ops/bulk-update`
```json
{
  "ids": [101, 102],
  "status": "in_review",
  "priority": "high",
  "adminMemo": "担当割当済み",
  "handler": "ops-a",
  "internalTags": ["store", "urgent"]
}
```

## 6. 添付ファイル運用ルール

1. MIME + 拡張子を双方チェック。
2. 10MB / 5件を上限（envで調整可）。
3. `attachmentMetadata` に `name/mime/size/url/hash/provider` を保存。
4. 同名ファイルでも Upload Plugin の hash ベースで衝突回避。
5. 危険拡張子は受け付けない（MIME不一致も拒否）。

## 7. スパム対応手順

### 7.1 自動判定
- honeypot 入力
- blocked words
- URL比率過多
- `.ru` メール
- user-agent 欠落
- 連投（IPベース）
- 短時間重複 payload

### 7.2 運用フロー
1. `status=spam` を日次でレビュー。
2. 誤判定時は `status=in_review`, `spamFlag=false` に更新。
3. abuse が多い場合は `INQUIRY_SPAM_MAX_PER_WINDOW` を調整。

## 8. 問い合わせ種別整理（main/store/fc）

- `sourceSite=main`
  - `general`, `project_request`, `media`, `appearance`, `other`
- `sourceSite=store`
  - `product`, `order`, `shipping`, `returns`, `defect`, `restock`
- `sourceSite=fc`
  - `membership`, `login`, `billing`, `benefits`, `content`, `other`

> 現在は main contact と store restock を中心運用。store/fcの個別フォーム追加時も同じモデルで横展開可能。

## 9. ローカル確認手順

```bash
npm run dev:backend
npm run dev:frontend
```

確認項目:
- main `/contact` で contact/request の入力→確認→送信→結果
- store の restock 送信
- Strapi Admin の Inquiry Submission 一覧/詳細更新
- `ops/list`, `ops/export.csv`, `ops/summary` の token 付きアクセス

## 10. staging / production 確認

1. `INQUIRY_OPS_TOKEN`, `INQUIRY_IP_HASH_SALT` が投入済み。
2. `INQUIRY_NOTIFY_TO` を設定した場合、通知メールが届く。
3. 自動返信を有効化した場合、ja/en/ko で文言崩れがない。
4. 添付上限・スパム判定・CSV export が期待通り。

## 11. トラブルシュート

- 400: 必須不足 / policy未同意 / MIME・拡張子不正
- 401: `x-inquiry-ops-token` 不正
- 413: `UPLOAD_MAX_FILE_SIZE_BYTES` か `INQUIRY_MAX_FILE_BYTES` 超過
- 429: グローバル rate-limit または burst 制限
- メール未送信: SMTP設定または provider 未設定（保存は継続）
