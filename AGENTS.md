# AGENTS.md

このファイルは `creava-platform` リポジトリ全体（frontend / backend / docs）で作業する実装者向けの運用ガイドです。  
目的は、**ホームページとしての完成度を最優先**しながら、既存基盤を壊さず継続改善できるようにすることです。

---

## 1. プロジェクト概要

- このプロジェクトは、クリエイター向けサイトのモノレポです。
- 構成は **frontend (React + Vite)** と **backend (Strapi v5)**。
- サイトの主役は「EC」ではなく、**ホームページ（ブランド訴求・依頼獲得・情報発信）**です。
- Store / Fanclub は重要機能ですが、位置づけは「自然な導線」です。

### 優先順位（意思決定の基準）

1. ブランディング（世界観・信頼感・一貫性）
2. 依頼獲得（Contact / Request の導線・CVしやすさ）
3. 情報発信（News / Blog / Events の継続運用）
4. Store / Fanclub の強化（ただしサイト全体バランスを崩さない）

---

## 2. 言語ルール（必須）

- **コミットメッセージは日本語**。
- **PR タイトル / PR 本文は日本語**。
- docs・運用メモ・Issue 用の説明文も日本語を基本とする。
- コード識別子（変数名・関数名）は既存慣習に合わせる（英語識別子は可）。
- UI 文言・翻訳追加時は **ja / en / ko** の整合を確認する。

---

## 3. 技術スタック前提

### frontend

- React 18 + TypeScript + Vite
- Tailwind CSS
- Framer Motion
- React Router v6
- i18next（ja / en / ko）
- Clerk（未設定時は条件付きで無効化される設計）
- SEO / Structured Data 実装あり

### backend

- Strapi v5（Strapi Cloud 前提）
- 開発: SQLite、本番: PostgreSQL
- CORS / 公開設定 / API token 運用が重要

### 外部連携

- Contact / Request: Formspree
- 認証: Clerk
- Store 購入導線: Stripe / BASE（段階的運用）

---

## 4. ディレクトリと責務（実装時の基本）

- `frontend/src/pages`: ルートページ
- `frontend/src/modules`: 機能単位（store / fanclub / contact / home など）
- `frontend/src/components`: 共通 UI
- `frontend/src/lib`: ルーティング定数、API、SEO、i18n などの基盤
- `backend/src/api/*`: Strapi content-types / routes / controllers / services
- `backend/config/*`: CORS・DB・ミドルウェア等の設定
- `docs/*`: 開発・運用・デプロイ手順

実装時は「ページに処理をベタ書き」より、既存の module / hook / lib に寄せる。

---

## 5. 実装方針（差分ベース）

- 既存仕様を尊重し、**差分ベースで最小変更**を原則とする。
- 既存の route / slug / API endpoint / schema を不用意に変更しない。
- 破壊的変更が避けられない場合は、移行手順と影響範囲を明文化する。
- seed / fixture で確認できる運用を壊さない。
- 共通処理の修正は共通層（hooks/lib/modules）で行い、重複実装を増やさない。

---

## 6. フロントエンド方針

- **Home をハブページとして維持**する。
- Header / Footer / Contact / Store / Fanclub / FAQ への導線を壊さない。
- Store を強化する際も、サイト全体を「EC 主役」に寄せすぎない。
- Light / Dark 両テーマの表示崩れを出さない。
- a11y（キーボード操作、focus、alt、見出し構造）を軽視しない。
- SEO と構造化データ（メタ情報・OG・JSON-LD）を維持する。
- ルーティング定数は既存の `routeConstants.ts` を起点に整合を取る。

---

## 7. バックエンド / CMS 方針

- Strapi Cloud 運用を前提に、管理しやすい schema を優先する。
- content type / relation / populate の整合を崩さない。
- HTML 応答混入・CORS・公開状態（Draft/Publish）に注意する。
- FC 制御・公開期限（limited）など既存アクセス制御を維持する。
- schema 変更時は frontend の endpoint / 型 / 表示に及ぶ影響を必ず確認する。

---

## 8. Store / Fanclub / Contact / CMS の注意点

### Store

- Store は重要だが主役化しすぎない。
- `available / soldout / coming_soon` など既存状態管理を尊重。
- FC 限定商品の制御を壊さない。

### Fanclub

- `fc_only` 判定や会員導線（ログイン・制限表示）の整合を維持。
- 公開期間終了後の取り扱い（archiveVisibleForFC 等）を壊さない。

### Contact / Request

- 依頼獲得導線として最重要。UI よりも安定動作と信頼感を優先。
- Formspree 連携・バリデーション・エラー表示を壊さない。

### CMS 運用

- Home/Latest 表示成立に必要なデータ件数・必須項目を意識。
- 管理画面運用者が扱いやすい命名・入力項目を優先。

---

## 9. SEO / i18n / A11y のルール

- SEO: title / description / og:image / canonical の整合を確認。
- 構造化データを変更する場合は、ページ意図に沿って最小差分で更新。
- i18n: 文言追加時は `ja/en/ko` のキー欠落を防ぐ。
- A11y: フォーカス遷移、aria 属性、代替テキスト、コントラストを確認。

---

## 10. 破壊的変更を避けるためのチェック

変更前に以下を短く整理してから着手する:

- 影響するページ・API・CMS モデル
- 既存導線（Home / Contact / Store / Fanclub）への影響
- env 変数・外部連携（Clerk/Formspree/Strapi）への影響

変更後は以下を確認する:

- 既存 URL / slug / endpoint が維持されている
- FC 制御と公開制御が意図通り動く
- Home の情報設計（ハブ機能）が維持されている

---

## 11. 作業前後に実行するコマンド

作業内容に応じて、可能な範囲で以下を実行する。

```bash
# ルート（frontend テスト）
npm run test:frontend

# frontend
npm run lint --prefix frontend
npm run build:frontend

# backend
npm run build:backend

# 必要時（CMS 表示確認データ）
npm run seed:backend
```

- 失敗した場合は、原因・未実施範囲・影響を PR に明記する。
- 環境依存で実行できない場合も、未確認事項として明記する。

---

## 12. コミット / PR ルール

- コミットは日本語で、1コミット1目的を意識する。
- PR タイトル / 本文は日本語で記述する。
- PR には最低限以下を含める:
  - 概要（何をなぜ変えたか）
  - 変更内容（要点）
  - 確認手順（実行コマンド / 目視確認）
  - 破壊的変更の有無（ある場合は移行方法）
  - 必要な env 変更や運用手順の差分

---

## 13. PR 作成時の出力テンプレート（日本語）

```md
## タイトル
（例）docs: このプロジェクト用の AGENTS.md を整備

## 概要
- 背景
- 目的

## 変更内容
- 変更点1
- 変更点2

## 確認手順
- 実行コマンド
- 目視確認ポイント

## 影響範囲
- frontend / backend / docs / 運用

## 破壊的変更
- なし / あり（移行手順）
```

---

## 14. 迷ったときの判断基準

- 派手な追加より、導線・信頼感・運用継続性を優先。
- 短期最適より、CMS 運用者と次の実装者が安全に触れる状態を優先。
- 不確実な変更は一気に広げず、小さな差分で検証可能に進める。
