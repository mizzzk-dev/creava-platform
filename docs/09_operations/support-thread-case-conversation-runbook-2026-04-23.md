# support thread / case conversation 運用 runbook（2026-04-23）

## 1. 構成
- case 本体: `inquiry-submission`
- thread/timeline: `support-case-event`
- case識別子:
  - `inquiryNumber`: user-facing ケース番号
  - `id`: DB id
  - `inquiryTraceId`: request trace
- source 文脈: `sourceSite`（main/store/fc）

## 2. reply type / visibility
- `eventType`
  - `user_message`: ユーザー返信
  - `admin_reply`: 運用返信（ユーザー可視）
  - `system_message`: システム記録
  - `internal_note`: 内部メモ
  - `status_update`: 状態更新
- `visibility`
  - `user_visible`: user timeline 表示可
  - `support_only`: support のみ
  - `internal_only`: internal admin のみ

## 3. status / waiting state
- `caseStatus`: `submitted|triaging|waiting_user|in_progress|resolved|closed|reopened`
- `supportThreadState`: `open|waiting_user|waiting_support|resolved|closed`
- `supportWaitingState`: `none|waiting_support|waiting_user|waiting_internal_review`

## 4. API
### user-facing
- `GET /api/inquiry-submissions/me/:id`
  - `supportTimeline` を返却（`user_visible` のみ）
- `POST /api/inquiry-submissions/me/:id/replies`
  - ログインユーザーが返信投稿
  - `idempotencyKey` で重複投稿抑止

### internal/support
- `GET /api/inquiry-submissions/ops/:id/messages?visibility=internal`
  - `INQUIRY_OPS_TOKEN` 必須
- `POST /api/inquiry-submissions/ops/:id/reply`
  - user-visible 返信
- `POST /api/inquiry-submissions/ops/:id/internal-note`
  - internal-only メモ
- 既存 `PATCH /api/inquiry-submissions/ops/bulk-update` は status/priority 一括更新で継続利用

## 5. unread / acknowledgement
- `supportUnreadUserCount`, `supportUnreadSupportCount`
- `supportUnreadState`: `none|unread_for_user|unread_for_support|unread_both`
- `supportAcknowledgementState`: `unacknowledged|acknowledged_by_user|acknowledged_by_support|acknowledged_both`
- user 詳細画面表示時に user unread を既読化

## 6. user-facing 確認手順
1. ログインして `/support` を開く
2. ケース一覧の未読バッジ確認
3. 「詳細を見る」から `返信履歴` を確認
4. `追加返信` フォームから返信送信
5. 返信後に timeline へ反映されることを確認

## 7. 運用側手順（curl 例）
```bash
# 返信（ユーザー可視）
curl -X POST "$API/api/inquiry-submissions/ops/123/reply" \
  -H "x-inquiry-ops-token: $INQUIRY_OPS_TOKEN" \
  -H "content-type: application/json" \
  -d '{"message":"状況を確認しました。追加情報をお願いします。","statusTo":"waiting_user","actorName":"support-a"}'

# 内部メモ
curl -X POST "$API/api/inquiry-submissions/ops/123/internal-note" \
  -H "x-inquiry-ops-token: $INQUIRY_OPS_TOKEN" \
  -H "content-type: application/json" \
  -d '{"note":"返金要否を法務確認へエスカレーション"}'
```

## 8. env / secrets
- backend runtime env
  - `INQUIRY_OPS_TOKEN`
  - `INQUIRY_CASE_REPLY_MAX_LENGTH`
  - `INQUIRY_NOTIFY_TO*`
- GitHub Secrets
  - backend: `INQUIRY_OPS_TOKEN`, SMTP 系
  - frontend: `VITE_STRAPI_API_URL`, `VITE_SITE_TYPE`
- 注意: internal note は frontend API で返さない（`user_visible` のみ返却）

## 9. local / staging / production チェック
1. public submit
2. my history / my detail 取得
3. user reply 投稿
4. ops reply 投稿
5. internal note 投稿
6. user detail で internal note が見えないこと
7. unread バッジ遷移確認

## 10. よくあるトラブル
- ops token 不一致 → 401
- user token なしで reply → 401
- JSON 以外の応答混入 → frontend API エラー
- 二重投稿 → `idempotencyKey` を付与して再送

## 11. 仮定
- guest inquiry の返信投稿は今回は対象外（閲覧追跡は `public/track` 継続）。
- support/internal の詳細UIは次PRで整備し、今回は API と user-facing thread を優先。
- 通知センター連携は event 保存を真実源として後続接続する。

## 12. support operations（queue / triage / assignment / SLA / escalation）

### 12-1. 追加API
- `GET /api/inquiry-submissions/ops/queue`
  - queue filter: `queueView`, `sourceSite`, `inquiryCategory`, `requesterType`, `assigneeId`, `priority`, `triageState`, `slaState`, `overdueState`, `escalationState`
- `PATCH /api/inquiry-submissions/ops/:id`
  - assignment / triage / priority / SLA 再計算 / escalation / template reply state を更新
- `GET /api/inquiry-submissions/ops/:id/template-suggestions`
  - rule-based auto classification と template reply 候補を返却

### 12-2. state 分離方針
- user-facing: `caseStatus`, `supportThreadState`, `supportWaitingState`
- triage: `triageState`, `triageReason`
- assignment: `assignmentState`, `assigneeId`, `assigneeName`, `assigneeState`
- SLA: `slaState`, `slaTargetAt`, `slaBreachedAt`, `overdueState`
- escalation: `escalationState`, `escalationReason`, `escalationTarget`
- template/automation: `templateReplyState`, `templateReplyCategory`, `templateReplyKey`, `autoClassificationState`, `classificationReason`, `suggestedReplyState`
- ops 可視化: `supportOpsVisibilityState`, `supportOpsActionState`, `supportLastAssignedAt`, `supportLastTriagedAt`, `supportLastEscalatedAt`, `supportLastSlaCheckedAt`

### 12-3. queue 運用で見るべき優先列
1. `assignmentState=unassigned`
2. `overdueState=overdue` または `slaState=breached`
3. `priority in (high, urgent)`
4. `caseStatus=waiting_user`（ユーザー待ち停滞確認）
5. `supportUnreadSupportCount > 0`（support 未読）

### 12-4. SLA/overdue 判定の初期ルール
- urgent: 4h、high: 12h、その他: 24h
- `INQUIRY_SLA_RISK_HOURS` 以内で `at_risk/due_soon`
- `INQUIRY_ESCALATION_LEAD_HOURS` 以内は escalation `suggested`
- `waiting_user` 中は `slaState=paused`

### 12-5. template reply / auto classification
- 返金・決済・ログイン問題を keyword で rule-based classify
- template は suggestion のみ（自動送信しない）
- internal note と template reply は別 API / 別 visibility を維持
