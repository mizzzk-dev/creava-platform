# Store / マイページ / ログイン機能 実装計画

最終更新: 2026-04-06

## 目的

以下の要望を、既存の「ホームページ主軸」導線を壊さず段階導入する。

- Store
  - お気に入り機能
  - 再入荷通知
  - 売上ランキング
  - ヒーロースライド
  - 並び替え・絞り込み
  - グリッド/リスト切り替え
  - 通貨切り替え
- マイページ
  - 注文履歴
  - 配送状況
  - 重要なお知らせ
  - メールマガジン設定
  - 退会
  - ログ履歴
  - ログイン通知設定
- ログイン
  - X / Google / Apple / Facebook

---

## 前提（現状）

- Store 一覧/詳細はすでにあり、`purchaseStatus` と `accessStatus` を使って表示制御している。
- マイページは会員状態の可視化が中心で、購買履歴・通知設定などは未実装。
- 認証は Clerk ベース（未設定時はゲスト運用にフォールバック）。

---

## 推奨実装順（4フェーズ）

## Phase 1: Store UX 強化（低リスク）

### 実装

1. 並び替え・絞り込み（クエリ連動）
   - `sort`: 新着 / 価格昇順 / 価格降順 / 人気
   - `filter`: 在庫状態・価格帯・FC限定
2. グリッド/リスト切り替え
   - LocalStorage 保存（再訪時復元）
3. お気に入り機能
   - ログイン前: ローカル保存
   - ログイン後: API 保存（将来）
4. ヒーローセクションをスライド化
   - 3〜4枚、CTA は Store / Contact / Fanclub へ

### 補足

- この段階では DB スキーマ変更なしで開始可能。
- 「EC 主役化」を避けるため、CTA は依頼導線（Contact）を常に同列に置く。

## Phase 2: 通知・ランキング・通貨（中リスク）

### 実装

1. 再入荷通知
   - `soldout` 商品に「再入荷通知を受け取る」
   - 初期は Formspree + 商品ID送信で運用可
2. 売上ランキング
   - `store-product-metrics` 的な集計モデルを追加
   - 表示は「直近7日」「直近30日」で切替
3. 通貨切り替え
   - 表示通貨のみ切替（決済通貨は現行維持）
   - 為替レートは日次取得 + キャッシュ

### 補足

- 為替は表示用と決済用を分離し、価格差異の注意書きを必ず表示。

## Phase 3: マイページ実運用機能（中〜高リスク）

### 実装

1. 注文履歴
2. 注文単位の配送状況追跡
3. 重要なお知らせ表示（全体/会員限定）
4. メルマガ設定
5. ログイン通知設定
6. ログ履歴（ログイン・重要操作）
7. 退会手続き

### データ方針

- `orders`, `shipments`, `member-notices`, `member-preferences`, `audit-logs` を Strapi 側で段階追加。
- 将来の決済プロバイダ移行を見越し、`externalOrderId`, `provider`, `providerStatus` を保持。

## Phase 4: ソーシャルログイン拡張（Clerk設定）

### 実装

- Clerk Dashboard で以下を有効化し、環境変数とリダイレクトURLを整備。
  - X
  - Google
  - Apple
  - Facebook

### 注意

- アプリ側コードより、プロバイダ設定・審査・コールバックURLの整合が主要作業。

---

## API / CMS 追加案（最小）

- `store-favorites`
  - user, product, createdAt
- `restock-subscriptions`
  - email, product, locale, source
- `store-product-metrics`
  - product, soldCount7d, soldCount30d, updatedAt
- `orders`
  - user, lines, total, currency, status, providerOrderId
- `shipments`
  - order, carrier, trackingNumber, status, lastSyncedAt
- `member-preferences`
  - newsletterOptIn, loginAlertOptIn, locale
- `member-notices`
  - title, body, audience, priority, publishedAt
- `audit-logs`
  - user, eventType, ipHash, userAgent, createdAt

---

## 受け入れ基準（抜粋）

- Store
  - URL クエリで同一条件を再現できる
  - 絞り込み時も FC 制御・公開制御を破壊しない
  - ダーク/ライト両方でレイアウト崩れなし
- マイページ
  - 直近注文と配送状況が 2クリック以内で到達
  - 通知設定変更が即時反映される
- ログイン
  - 4プロバイダで初回登録/再ログイン/連携解除が確認できる

---

## 実装後にさらに進化できるポイント

1. **レコメンド最適化**
   - 閲覧履歴 + 会員属性で「あなた向け」商品/記事を Home に反映。
2. **在庫予測と欠品予防**
   - 売上速度から欠品予測を作り、再入荷通知対象に自動告知。
3. **CRM連携**
   - お気に入り・通知希望・購入履歴をセグメント化して配信最適化。
4. **LTVダッシュボード**
   - 会員継続率、再購入率、流入別CVRを可視化。
5. **サポート業務効率化**
   - 注文/配送問い合わせテンプレートをマイページ内に統合。
6. **国際対応の段階拡張**
   - 通貨だけでなく送料/税/配送可否を地域別に制御。
7. **A/Bテスト基盤**
   - ストアヒーロー、ランキング表示、CTA文言を継続最適化。

---

## まず最初の 2 週間でやる推奨スコープ

- 週1
  - 並び替え・絞り込み
  - グリッド/リスト切り替え
  - お気に入り（ローカル保存）
- 週2
  - ヒーロースライド
  - 再入荷通知（Formspree）
  - マイページに「注文履歴・通知設定」枠だけ先行配置（APIはモック）

これにより、UI体験を先に改善しつつ、バックエンド拡張を安全に後追いできる。
