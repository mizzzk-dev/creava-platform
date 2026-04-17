# project-context

## 概要
- creava-platform はクリエイターサイトの monorepo。
- frontend は React+Vite+TS、backend は Strapi v5。
- main/store/fc の3サイト運用（`VITE_SITE_TYPE`）。

## 役割差
- main: ブランド全体ハブ（mizzz.jp）。
- store: 購買体験の独立サイト（store.mizzz.jp）。
- fc: 会員体験の独立サイト（fc.mizzz.jp）。

## 実装実態（docs差分が出やすい点）
- 認証: Clerk ではなく Logto 実装が中心。
- フォーム: Formspree ではなく Strapi 公開API送信が実態。
- i18n: ja/en/ko 対応。

## 優先順位
1. ブランド一貫性
2. Contact/Request のCV導線
3. 情報発信導線
4. store/fc の深い体験
