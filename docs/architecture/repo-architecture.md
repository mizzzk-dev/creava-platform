# リポジトリアーキテクチャ

## 全体像
- frontend: React + Vite + TypeScript。
- backend: Strapi v5。
- 配信単位: `main` / `store` / `fanclub` を `VITE_SITE_TYPE` で分岐。

## 責務
- **main**: ブランドハブ、導線統合。
- **store**: 商品閲覧・購入導線。
- **fanclub**: 会員導線・限定公開。
- **backend**: CMS/課金補助/問い合わせ受付。
- **docs**: 実装追従の運用知識。

## 変更優先順位
1. 破壊回避（route/slug/endpoint/schema）
2. 導線維持（Home/Contact/store/fc）
3. 共通層寄せ（module/hook/lib）
4. docs 更新

## docs と実装の不一致対応
- コード実態を正とする。
- docs は差分理由を明記して更新。
