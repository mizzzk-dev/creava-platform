# システム概要書

- 更新日: 2026-04-10
- 対象: プロジェクト全体
- 目的: 「何のためのシステムか」「main/store/fc/backend の役割」を最短で理解する
- 前提: マルチサイト構成（main/store/fanclub）を `VITE_SITE_TYPE` で切り替える
- 関連ドキュメント: [基本設計書](../03_basic-design/basic-design.md), [運用マニュアル](../09_operations/operations-manual.md)

## 目次
1. システムの目的
2. 提供価値
3. アプリケーション構成
4. 主な利用者
5. 主要機能一覧
6. 現状ギャップ

## 1. システムの目的

このシステムは「クリエイター活動のホームページ」を中核に、次の3軸を実現します。

- ブランディング（作品・最新情報・世界観の提示）
- 依頼獲得（Contact / Request からの問い合わせ）
- 継続収益化（Store / Fanclub への自然導線）

## 2. 提供価値

- ユーザーは main サイトで全体像を把握し、必要に応じて store / fanclub サイトへ移動できます。
- 管理者は Strapi CMS で News / Blog / Works / Store などを更新できます。
- 会員向け制御（`public`, `fc_only`, `limited`）で公開範囲を管理できます。

## 3. アプリケーション構成

- **frontend (React + Vite)**: 表示、ルーティング、フォーム、認証連携、SEO
- **backend (Strapi v5)**: コンテンツ管理 API、Stripe webhook 受信、公開状態管理
- **外部連携**
  - Clerk: 認証 / 会員状態判定
  - Formspree: お問い合わせ送信
  - Stripe: 購入 / 継続課金

## 4. 主な利用者

- サイト訪問者（ゲスト）
- 会員（free/member/premium）
- 管理者（CMS運用者）

## 5. 主要機能一覧（実装ベース）

- コンテンツ閲覧（Works, News, Blog, Events, Fanclub, Store）
- 会員制限閲覧（`ContentAccessGuard`, `FanclubAuthGuard`）
- 問い合わせ送信（Formspree）
- ストア購入開始 / FC加入決済開始（Stripe Checkout API）
- webhook同期（支払い・購読情報記録）

## 6. 現状ギャップ

- バックエンド `.env` サンプルがリポジトリ上に未整備
- Docs が時系列メモ中心で、未経験者向け入口が不足
- API/DB/画面/運用の横断資料が分散
