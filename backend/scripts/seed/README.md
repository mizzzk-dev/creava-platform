# Seed Script (Strapi)

`backend/scripts/seed/index.ts` は `fixtures/` の JSON を使って、Strapi の初期表示確認用データを投入します。

## 実行方法

```bash
# repo root
npm run seed:backend

# backend/ 直下
npm run seed
```

## 前提

1. Strapi content type が生成済み
2. Strapi 開発サーバーを停止中（seed が内部で Strapi を起動するため）
3. DB 初期化済み（`npm run develop --prefix backend` を1回実行）

## 対応 content type

### Collection types
- `api::work.work` ← `works.json`
- `api::news-item.news-item` ← `news.json`
- `api::blog-post.blog-post` ← `blog.json`
- `api::event.event` ← `events.json`
- `api::store-product.store-product` ← `store-products.json`
- `api::fanclub-content.fanclub-content` ← `fanclub.json`
- `api::media-item.media-item` ← `media-items.json`
- `api::award.award` ← `awards.json`
- `api::faq.faq` ← `faq.json`

### Single types
- `api::profile.profile` ← `profile.json`
- `api::site-setting.site-setting` ← `site-setting.json`

## フロント表示成立の最小目安

- Works: 3〜4件（public / fc_only / limited を含む）
- News: 3件
- Blog: 2件
- Events: 2件
- Store: 3件
- Fanclub: 2件
- Settings: 1件

> 既存 fixture は上記より多めです。UI確認時は件数を減らした fixture に差し替えて運用可能です。

## 画像フィールド運用

- `thumbnail`, `previewImage`, `ogImage` は media フィールド
- 画像なしパターンも UI 確認のために一部残す
- ローカル Strapi (`/uploads/...`) と Strapi Cloud（絶対URL）をどちらも想定

## 再投入

slug / order が一致するデータはスキップされます。フル再投入したい場合:

```bash
rm backend/.tmp/data.db
npm run develop --prefix backend
# 起動確認後に停止
npm run seed:backend
```
