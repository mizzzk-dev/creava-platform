# お問い合わせフォーム復旧 runbook（2026-04-22）

## 0. 対象と結論
- 対象サイト: `mizzz.jp` (main), `store.mizzz.jp` (store), `fc.mizzz.jp` (fc)
- 送信基盤: Strapi `POST /api/inquiry-submissions/public`
- 保存先: Strapi Content Manager `Inquiry Submission`
- store/fc の `/contact` は main `/contact` にリダイレクトし、問い合わせ運用は main 側に集約

## 1. 死因（直接原因）
1. **フロント側の送信失敗原因が握りつぶされ、ユーザーにも運用側にも追跡情報が出ていなかった。**
   - 例: runtime env 誤設定、CORS、HTML混入、validation 失敗が起きても `送信失敗` のみ表示されるため、死因判別不可。
2. **送信成功表示と実配送状態（通知メールの成否）が分離されていなかった。**
   - DB 保存成功と通知失敗を区別できず、運用側で「届いた/届いていない」の判断が困難。
3. **traceability が不足していた。**
   - request id / trace id を画面・レスポンスで十分に表示せず、ログ追跡がしにくかった。

## 2. フロー定義（入力→確認→送信→結果→運用確認）
- inquiryValidationState: `validating` / `validation_error`
- inquiryConfirmState: `ready_to_confirm` / `confirmed`
- inquirySubmitState: `submitting` / `succeeded` / `failed`
- inquiryDeliveryState: `delivered` / `failed` / `unknown`
- inquiryResultState: `success` / `validation_error` / `delivery_error` / `system_error`
- inquiryTraceId: `x-request-id`（レスポンスにも返却）
- inquiryReceivedAt / inquiryConfirmedAt / inquirySentAt / inquiryFailedAt をレスポンスで返却

## 3. 現在の問い合わせ導線
- main: `/contact` で DynamicForm（確認ステップあり）
- store: `/contact` は `https://mizzz.jp/contact` へリダイレクト
- fc: `/contact` 導線は main contact に集約

## 4. 送信成功/失敗の判定
- 成功条件:
  1) Strapi `inquiry-submission` への保存成功（storage state = `stored`）
  2) レスポンス JSON 受信
- 通知状態:
  - `sent`: 通知メール送信成功
  - `failed`: 通知メール送信失敗（DB保存は成功）
  - `not_configured`: 通知先未設定
- 画面表示:
  - success 時は `traceId`, `delivery`, `result` を表示
  - error 時は分類済みメッセージ（validation/delivery/system）+ requestId を表示

## 5. 運用側確認手順
1. Strapi Admin → `Inquiry Submission` を開く
2. `submittedAt` 降順で最新レコードを確認
3. `sourceSite`, `formType`, `inquiryCategory`, `status`, `spamFlag` を確認
4. trace が必要な場合:
   - ユーザー画面の `traceId`
   - backend ログの `[rid=...]` で照合
5. 配送失敗時:
   - レコード保存はされるため、管理画面に存在するか確認
   - メールプラグイン/SMTP 設定と `INQUIRY_NOTIFY_TO*` を確認

## 6. 失敗時の一次切り分け
1. フロント runtime env
   - `VITE_STRAPI_API_URL` が正しいか
2. backend env
   - `INQUIRY_IP_HASH_SALT`, `INQUIRY_OPS_TOKEN`, `INQUIRY_SPAM_*`
3. 通知設定
   - `INQUIRY_NOTIFY_TO` またはルーティング用 `INQUIRY_NOTIFY_TO_<SITE>_<FORMTYPE>`
4. CORS
   - `FRONTEND_URL` に対象オリジンを追加済みか
5. レート制限
   - 429 と `Retry-After` を確認

## 7. GitHub Secrets / Runtime 設定
- Frontend (GitHub Secrets / Variables)
  - `VITE_STRAPI_API_URL`
  - `VITE_SITE_TYPE`（main/store/fc）
- Backend
  - `INQUIRY_IP_HASH_SALT`
  - `INQUIRY_OPS_TOKEN`
  - `INQUIRY_SPAM_WINDOW_MS`
  - `INQUIRY_SPAM_MAX_PER_WINDOW`
  - `INQUIRY_DUPLICATE_WINDOW_MS`
  - `INQUIRY_NOTIFY_TO`（または site/form ごとの routed env）
  - SMTP 関連 env（メール通知利用時）

## 8. local / staging / production 確認手順
1. フォーム入力
2. validation エラー確認
3. 確認ステップへ遷移
4. 確認から入力へ戻る
5. 正常送信
6. success 画面に `traceId` が出る
7. Strapi Admin で同一レコード確認
8. 通知有効時は通知メール到達確認
9. 故意に env を壊した状態で error 分類表示を確認

## 9. よくあるトラブル
- `VITE_STRAPI_API_URL` 未設定: 送信不可（system_error）
- CORS 不一致: fetch 失敗（delivery_error）
- 送信先が HTML 返却: URL/プロキシ誤設定（delivery_error）
- 通知先未設定: 保存成功するが通知は `not_configured`

## 10. 仮定
- SMTP の最終運用設定（provider/credential）は環境ごとに既存運用手順に従う。
- store/fc は main contact へ集約し、問い合わせ投稿データの `sourceSite` で文脈を識別する。
