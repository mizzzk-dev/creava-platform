# AGENTS.md

`creava-platform` 全体で使う durable guidance（最初に読む実務ルール）です。  
詳細手順は `.agents/skills/` と `docs/` を参照してください。

## 1) リポジトリの目的と責務
- クリエイター向け monorepo（frontend: React/Vite、backend: Strapi v5）。
- `mizzz.jp`（main）はブランド全体のハブ。
- `store.mizzz.jp`（store）は購入体験に集中した独立サイト。
- `fc.mizzz.jp`（fanclub）は会員体験に集中した独立サイト。
- Home は main/store/fc を自然に接続する入口。

## 2) 優先順位（迷ったらこの順）
1. ブランド一貫性と信頼感
2. Contact / Request のCV導線
3. News / Blog / Events の継続運用
4. Store / Fanclub の深い体験

## 3) 実装境界（どこに何を書くか）
- `frontend/src/pages`: ルート単位の構成。
- `frontend/src/modules`: 機能ロジック・セクション。
- `frontend/src/components`: 再利用 UI。
- `frontend/src/hooks`: 横断フック。
- `frontend/src/lib`: API/i18n/theme/SEO/routes など基盤。
- `backend/src/api/*`: Strapi content-type / route / controller / service。
- `backend/config/*`: CORS・DB・middleware・server 設定。
- `docs/*`: 設計・運用・runbook（実装に追従）。

## 4) 壊してはいけないもの
- 既存 route / slug / endpoint / schema を不用意に変更しない。
- `VITE_SITE_TYPE` による main/store/fanclub の分離前提を維持。
- Contact / Request（`/api/inquiry-submissions/public`）の安定導線を維持。
- FC 制御（`fc_only` / `limited` / `archiveVisibleForFC`）を維持。
- Light/Dark、i18n（ja/en/ko）、SEO/OG/canonical、JSON-LD を壊さない。

## 5) frontend 指針
- pages へベタ書きせず modules/hooks/lib に寄せる。
- Home をハブとして維持し、store/fc へ寄せすぎない。
- a11y（focus、見出し、aria、キーボード操作）を維持。
- 文言追加時は `ja/en/ko` を同時更新。

## 6) backend/Strapi 指針
- content-type / relation / populate / Draft-Publish の整合を維持。
- schema 変更時は frontend 型・APIクライアント・表示への波及を確認。
- CORS・公開状態・権限・管理画面運用性を優先。

## 7) fetch/API hardening 指針
- `response.ok` / `content-type` を必ず検証。
- HTML 応答混入を明示検知してエラー化。
- timeout / retry / graceful fallback を実装。
- 失敗時 UX（再試行導線・文脈あるメッセージ）を維持。

## 8) docs と実装がズレたとき
- コード実態を正とする。
- docs 側に「差分」「影響範囲」「移行メモ」を追記して解消。

## 9) 日本語運用・命名ルール
- コミット、PR タイトル/本文、docs は日本語を基本とする。
- ブランチ名は英小文字 + ハイフン区切り。
- ブランチ名・コミット・PR本文に `codex` / `Claude` を含めない。

## 10) 変更前チェック
- 影響ページ/API/CMS モデル。
- main/store/fc/Contact 導線への影響。
- env（Logto/Strapi/Stripe など）と外部連携への影響。

## 11) 変更後チェック
- 既存 URL/slug/endpoint/schema 維持。
- FC 制御・公開制御の回帰なし。
- Home の情報設計（ハブ機能）維持。

## 12) 最低限の build / test / review
```bash
npm run test:frontend
npm run lint --prefix frontend
npm run build:frontend
npm run build:backend
# 必要時
npm run seed:backend
```
