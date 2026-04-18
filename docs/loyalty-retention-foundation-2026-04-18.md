# loyalty-retention-foundation (2026-04-18)

## 目的
- FC を中心に main / store / fc 横断で「継続して戻る理由」を明示する。
- マイページを契約情報の確認場所から、継続価値・特典価値・次行動のハブへ拡張する。
- campaign を会員導線に接続し、運用時に audience / accessLevel / site / locale で制御できる土台を追加する。

## 現状調査サマリ（実装前）
1. **継続導線課題**
   - `/mypage` は注文・配送・通知設定が中心で、継続期間や更新日、会員ランク相当の状態表示が弱い。
   - 会員向け施策（先行・限定・キャンペーン）の「自分向け可視化」が不足。
2. **会員価値が伝わりにくい箇所**
   - benefit 文言は存在するが、対象条件（accessLevel / audience）と直結した導線が少ない。
3. **main / store / fc 連携の弱い箇所**
   - 横断導線はあるが、会員状態に合わせた差し分けが限定的。
4. **特典 / 限定 / 先行導線で整理すべき箇所**
   - campaign モデルに audience / site / locale の運用軸が不足。
   - マイページに会員向け campaign を出す接点がない。

## ロイヤルティ情報設計
今回 `loyaltyProfile`（frontend 側）を定義し、以下を保持:
- `membershipStatus`
- `membershipPlan`
- `membershipStartedAt`
- `renewalDate`
- `tenureMonths`
- `loyaltyBadge`
- `rewardState`
- `accessLevel`
- `memberBenefits`
- `campaignEligibility`
- `earlyAccessEligible`
- `limitedContentEligible`
- `favoriteCategory`
- `engagementHint`
- `retentionSegment`
- `displayPriority`

> 現段階では API の真実源統合前提で、mock/fallback に同構造を持たせ、将来の member-status API 統合時に置換しやすい構造とした。

## 実装内容
### 1) マイページ継続導線強化
- `MemberLoyaltyPanel` を追加し、会員状態・継続期間・更新日・ロイヤルティバッジを1ブロックで可視化。
- 会員特典一覧と、対象 campaign のショートリストを同一画面に統合。
- FC / Store / Support へのショートカットを追加し、再訪行動を明示。

### 2) 会員特典 / 先行 / 限定導線
- `memberBenefits` を列挙表示。
- `early_access_click` / `limited_content_click` イベントをショートカットに接続。

### 3) campaign 運用基盤
- Strapi `campaign` に以下属性を追加:
  - `audience`
  - `accessLevel`
  - `targetSites`
  - `targetLocales`
  - `campaignEligibility`
  - `memberBenefits`
  - `retentionSegment`
- frontend の campaign 正規化に上記属性を追加し、マイページ側で site/locale/userState でフィルタ。

### 4) analytics / 計測
- マイページ表示時:
  - `loyalty_badge_view`
  - `renewal_info_view`
- マイページ導線:
  - `mypage_shortcut_click`
  - `member_campaign_click`
  - `early_access_click`
  - `limited_content_click`
  - `fc_to_store_loyalty_click`
  - `support_to_membership_click`

## 運用メモ
- **DNS 追加は不要**（既存 main/store/fc サブドメイン運用内で完結）。
- **追加SaaSは不要**（既存 analytics / Strapi / frontend 実装の拡張のみ）。
- 金銭ポイント制度は未導入。法務/会計インパクトの高い要素は次フェーズで別PR管理。

## 環境変数・Secrets
- 今回、新規の必須 env / GitHub Secrets 追加はなし。
- 既存 `VITE_ANALYTICS_OPS_ENDPOINT`, `VITE_GA_MEASUREMENT_ID` を利用。

## ローカル確認手順
1. `npm run lint --prefix frontend`
2. `npm run test:frontend`
3. `npm run build:frontend`
4. `npm run build:backend`
5. `/mypage` で会員状態ごとの差分確認（guest/member/admin）

## staging / production 確認観点
- campaign の `audience/accessLevel/targetSites/targetLocales` を切替え、表示差分が正しいか。
- light/dark と ja/en/ko でレイアウト崩れがないか。
- member-only 導線が guest に誤露出しないか。

## 想定される運用ミスと対処
- audience を `member` にしたのに targetSites が空で全サイト露出
  - 対処: 公開前に `targetSites` を必ず設定。
- endAt を設定し忘れ、期限施策が残留
  - 対処: editorial checklist に終了日時必須を追加。
- locale 設定漏れで翻訳未完了文言が表示
  - 対処: 公開チェックで ja/en/ko を必ず確認。

## 仮定
- 認証・会員状態の真実源 API は将来統合予定で、今回は既存 mock/fallback を継続利用。
- campaign の site/locale/audience 運用は CMS 側の入力ルール整備で担保する前提。
