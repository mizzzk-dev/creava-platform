# データ基盤 / BI / KPI 統合基盤整備（2026-04-19）

## 0. スキル利用
- 使用 skill: `repo-context` → `docs-and-runbook`。
- 理由: main/store/fc/backend/docs を横断する既存実装調査と、運用ドキュメント・env・runbook の同時更新が必要だったため。

## 1. 現在のデータ基盤課題（調査結果）
1. `analytics-event` は raw event 保存と ops summary を持つが、order/revenue/subscription/support との統合ビューが不足。
2. revenue は internal summary がある一方、acquisition/conversion/retention/support との共通KPI定義が無い。
3. cohort 分析は実務で必要な起点（signup/first purchase/fc join）を同一画面で確認できない。
4. campaign / loyalty / notification / support の施策効果が分断され、意思決定時に手作業集計が必要。
5. dashboard export と docs の定義対応が弱く、担当者ごとの解釈差が生まれやすい。

## 2. 責務分離（raw event / business fact / KPI）
- `rawEvent`: `analytics-event`。行動ログを時系列で保持。
- `businessFact`: `order`, `revenue-record`, `subscription-record`, `inquiry-submission`, `delivery-log`, `app-user`。
- `summaryTable`: API応答で `daily/monthly/bySite/byLocale/byCampaign` を生成。
- `kpiMetric`: acquisition/conversion/retention/revenue/support を `kpi` オブジェクトへ統合。
- `sourceOfTruth`: 応答に content-type 名を明示し、指標出所を固定。
- `freshnessState/syncState`: 最新時刻と同期状態（例: revenue `syncState`）を明示。

## 3. 実装内容（統合基盤 + ダッシュボード）

### 3.1 backend: internal BI API
追加 endpoint:
- `GET /api/internal/bi/overview`
- `GET /api/internal/bi/cohorts`
- `GET /api/internal/bi/export.csv`

機能:
- main/store/fc/cross の site別サマリー。
- locale別イベント量。
- campaign別売上寄与（order基準）。
- acquisition / conversion / retention / revenue / support KPI を単一レスポンス化。
- cohort（signup / firstPurchase / membership / supportImpact）の月次テーブル生成。
- CSV export は日次セッション + CTA + 売上を同定義で出力。

### 3.2 frontend: internal admin BI表示
- Internal Admin Console に BI overview / cohort / BI CSV export の操作を追加。
- financial summary と同じ画面で KPI・cohort を確認可能。

## 4. KPI定義（今回反映した最小セット）
- acquisition: `sessions`, `newUsers`, `trafficByReferrer`
- conversion: `mainToStoreRate`, `mainToFcRate`, `checkoutStartRate`, `purchaseCompleteRate`, `fcJoinCompleteRate`, `formCompletionRate`
- retention: `revisitUsers`, `notificationRevisitEvents`, `activeMembershipCount`, `graceMembershipCount`
- revenue: `gross`, `net`, `refund`, `refundRate`, `averageOrderValue`, `subscriptionRevenue`
- support: `totalInquiries`, `byCategory`

## 5. コホート / 継続 / 収益分析
- cohortKey: `signup_month`, `first_purchase_month`, `membership_start_month`
- retentionWindow: `30d`, `60d`（現状は枠定義。保持値は今後の再訪判定強化で拡張）
- supportImpact を別テーブル化し、support負荷と継続悪化の早期検知に接続しやすくした。

## 6. support / CRM / loyalty / campaign 横断
- campaign: `order.campaignId` を起点に売上寄与を集約。
- loyalty/CRM: `app-user.loyaltyState`, `membershipStatus` を retention 文脈に接続可能な形で参照。
- notification: `delivery-log` sent/failed/clicked を KPI に組み込み。
- support: `inquiry-submission` をカテゴリ別に分解し、負荷の増減理由を追いやすくした。

## 7. 予測 / 異常検知 / alert 土台
- 予測モデルは未導入。
- 代わりに `daily/monthly` と `freshnessState/syncState` を先に整備し、異常閾値ルールを後続PRで定義しやすくした。

## 8. env / CI / runbook 整理
- `backend/.env.example` に BI 集計パラメータを追加。
- `docs/10_appendix/environment-variables.md` に BI runtime env / Secrets を追記。
- **DNS変更不要**（既存ドメイン運用・API/画面/ドキュメント更新のみ）。

## 9. 失敗ケースへの対応方針
- analytics と売上がつながらない: `sourceOfTruth` と `summaryTable` の同時参照で追跡。
- store と fc 分断: `bySite` を同一レスポンスへ固定。
- campaign 効果不明: `byCampaign` を追加。
- support 負荷要因不明: `support.byCategory` + cohort `supportImpact` を追加。
- retention施策評価不可: retention KPI + cohort テーブルの同時表示。
- KPI定義ブレ: 本ドキュメントと internal BI API のレスポンス項目名を一致させる。

## 10. 実装順（今回）
1. 現状確認（analytics/revenue/order/support/subscription/internal admin/docs/env/ci）
2. KPI定義と責務分離を文書化
3. backend internal BI API 追加
4. frontend internal dashboard 追加
5. cohort/export 追加
6. env/docs 更新

## 11. 残課題
- retentionWindow の実測値算出（30/60/90日）を user-level event join で厳密化。
- forecast / anomaly detection / alert routing（Slack/メール）実装。
- role別 column masking（support と finance で表示粒度分離）。
- summary の定期 refresh/backfill job（現状は read-time 集計）。

## 12. 仮定
- order / revenue / subscription / support のレコードは既存Strapiに継続投入される前提。
- campaignId は order 側で利用される前提。
- internal admin 利用者は Logto 内部ロール付与済み前提。
