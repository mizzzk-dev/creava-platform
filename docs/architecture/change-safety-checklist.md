# 変更安全チェックリスト

## 変更前
- [ ] 影響対象（page/api/schema/env）を列挙した
- [ ] main/store/fc の導線影響を確認した
- [ ] 外部連携（Logto/Stripe/Form/Strapi）影響を確認した

## 変更後
- [ ] 既存 URL/slug/endpoint/schema を維持した
- [ ] FC 制御（fc_only/limited/archiveVisibleForFC）を確認した
- [ ] Home のハブ機能を維持した
- [ ] i18n（ja/en/ko）欠落がない
- [ ] light/dark と a11y の回帰がない
- [ ] SEO/OG/canonical/JSON-LD の回帰がない

## 最低実行コマンド
```bash
npm run test:frontend
npm run lint --prefix frontend
npm run build:frontend
npm run build:backend
```
