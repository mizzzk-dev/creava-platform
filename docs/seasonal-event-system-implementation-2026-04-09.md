# store / fc シーズナル・イベント体験システム実装メモ（2026-04-09）

## 1. 現状確認結果
- 共通レイアウトは `StoreLayout` / `FanclubLayout` で分離され、ヘッダー/フッターは共通化済み。
- Hero / Pickup / Weekly update は store/fc それぞれで `VisualHeroSection` と編集セクション群を使用。
- ローディング演出は既存 `LoadingScreen` に初回/リロードの二段制御あり。
- スクロール演出は `SectionReveal` の単一プリセット運用。
- CMS は `site-setting` single type の項目中心に制御、seasonal 専用項目は未整備。
- i18n は `ja/en/ko` の `common.json` で運用。

## 2. 今回追加した seasonal / event system 一覧
- Seasonal Theme Registry（`default/christmas/halloween/newyear`）
- Seasonal Theme Resolver（手動 override / 予約 / 日付自動 / default 優先制御）
- Seasonal Theme Provider（store/fc 共通）
- Seasonal Loading 切替
- Seasonal Scroll Preset 切替
- New Year 初回訪問演出（年単位）
- Omikuji ミニ体験（年単位保存）

## 3. 共通で追加 / 改善したこと
- seasonal 文脈を持つ context/hook を追加。
- SiteSettings 型と Strapi schema に seasonal 運用項目を追加。
- Hero / Announcement / Section motion がテーマ連動可能な構造に変更。

## 4. store で追加 / 改善したこと
- store レイアウトに seasonal provider / loading / 新年演出を追加。
- store home hero で seasonal 表示ラベルと変種を受け取る構造を追加。

## 5. fc で追加 / 改善したこと
- fanclub レイアウトに seasonal provider / loading / 新年演出を追加。
- fc home hero で seasonal 表示ラベルと変種を受け取る構造を追加。

## 6. ロードアニメーションで追加したこと
- テーマ別カラー（default/christmas/halloween/newyear）切替。
- newyear + 初回時の追加コピー表示。

## 7. スクロールアニメーションで追加したこと
- seasonal scroll preset（default/soft/dramatic）対応。

## 8. 正月初回訪問演出で追加したこと
- 年単位 first visit 判定（site別 key）
- 初回のみ新年オーバーレイを表示できる制御

## 9. おみくじ機能で追加したこと
- 大吉〜凶の結果抽選
- 結果の年内保持
- 多言語文言追加

## 10. Strapi / CMS で追加した項目
- seasonalTheme / themeMode / autoThemeEnabled / manualThemeOverride
- seasonalStartAt / seasonalEndAt
- heroSeasonalVariant / illustrationSeasonalVariant / loadingAnimationVariant / scrollAnimationVariant
- sectionStyleVariant / seasonalBadgeVariant / seasonalBackgroundVariant
- seasonalCampaign / themeAppliedSites
- newyearIntroEnabled / omikujiEnabled / omikujiMessages / omikujiVisualVariant / perYearEventKey / firstVisitOnlyEnabled

## 11. 計測追加内容
- `seasonal_theme_applied`
- `omikuji_draw`
- `newyear_overlay_close`
- 季節導線向け helper（`seasonal_block_click`, `omikuji_result`）を追加

## 12. 多言語 / テーマ / モバイル / パフォーマンスへの影響
- `ja/en/ko` に seasonal 文言追加。
- reduced motion 既存考慮を維持。
- 演出は CSS gradient と軽量 motion を中心に実装し、重量アセット依存を回避。

## 13. API / 安定性への影響
- 既存 endpoint/slug は維持。
- site-setting 追加属性は optional とし、未設定時 fallback で既存挙動維持。

## 14. 追加 / 修正ファイル一覧
- frontend seasonal module 一式
- Loading / SectionReveal / VisualHero / Layouts / Announcement / Home/Fc pages
- locales (ja/en/ko)
- backend site-setting schema

## 15. 確認項目
- lint / frontend build 実施
- backend build は strapi CLI 不在で未完了

## 16. 残課題
- seasonal モデルを single type から独立 model 化（SeasonalThemeConfig 等）
- main site (`mizzz.jp`) への適用
- GitHub PR の reviewer/milestone 実設定（利用環境依存）

## 17. 作成したブランチ名
- `feature-seasonal-event-system`

## 18. コミット一覧
- 本ファイル作成時点では最終コミット前

## 19. PR本文案
- 下記「PR本文テンプレート案」を参照

## 20. PRメタデータ一覧
- type: feature
- priority: high
- areas: shared-ui / store / fc / cms / seasonal
- labels: feature / seasonal / event-experience / frontend / ui / ux / animation / store / fc / cms

## 21. 設定したラベル一覧
- 本文メタデータに明記（GitHub API 連携不可時の代替）

---

## PR本文テンプレート案
```yaml
type: feature
priority: high
areas:
  - shared-ui
  - store
  - fc
  - cms
  - seasonal
labels:
  - feature
  - seasonal
  - event-experience
  - frontend
  - ui
  - ux
  - animation
  - store
  - fc
  - cms
review_points:
  - 季節テーマが手動 / 自動の両方で切り替わるか
  - 多言語で表示崩れがないか
  - ライト/ダーク両テーマで違和感がないか
  - モバイルで演出が重すぎないか
  - 正月初回訪問演出が年1回の想定どおり動くか
  - おみくじ演出が邪魔すぎず楽しいか
risks:
  - アニメーション追加による表示負荷
  - seasonal config 追加による運用複雑化
  - 初回訪問判定の状態保持ミス
not_done:
  - main サイトへの seasonal 適用
  - Strapi での独立 seasonal model 化
```

## 概要
- store / fc の seasonal/event 体験を共通基盤化し、手動・自動切替と新年限定体験を追加。

## 変更内容
- seasonal registry / resolver / provider / storage / newyear experience を追加
- layout / hero / announcement / section motion / loading を seasonal 対応
- site-setting schema と型を seasonal 運用項目へ拡張
- ja/en/ko の seasonal 文言を追加

## 確認手順
- `npm run lint --prefix frontend`
- `npm run build:frontend`
- `npm run build:backend`（環境に strapi CLI がある場合）

## 影響範囲
- frontend / backend(cms schema) / docs

## 破壊的変更
- なし（追加フィールドは optional 運用）
