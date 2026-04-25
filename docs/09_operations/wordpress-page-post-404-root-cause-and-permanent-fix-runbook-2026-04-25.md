# WordPress 固定ページ / 投稿 404 切り分け・恒久修正 runbook（2026-04-25）

## 0. 対象と症状
- 対象: `mizzz.jp` / `store.mizzz.jp` / `fc.mizzz.jp` で利用する WordPress + headless frontend。
- 症状: 「WordPress 管理画面では作成済みなのに公開 URL が 404」。
- 注意: **WordPress URL の 404** と **headless frontend URL の 404** は分けて扱う。

## 1. 今回の根本原因（コード起点）
1. `creava-platform-core` が route 診断 API を持たず、permalink/rewrite/server/frontend のどこで失敗したか追跡しづらかった。  
2. plugin activation/deactivation で rewrite flush が保証されず、post type 登録変更後に stale rewrite が残る余地があった。  
3. post type 登録で `publicly_queryable` / `query_var` / `rewrite` / `has_archive` が明示されておらず、環境差で URL 解決が不安定化し得た。  
4. public REST で `post` / `page` を同一ルールで検証する route がなく、preview は見えるが live route 判定が遅れる運用だった。  

## 2. 実装した恒久修正
### 2-1. WordPress 側
- `register_post_type` を再設計し、public type で `publicly_queryable` / `has_archive` / `query_var` / `rewrite` を明示。  
- plugin activation/deactivation 時のみ rewrite flush を実行（毎リクエスト flush を禁止）。  
- `/wp-json/creava/v1/posts` と `/wp-json/creava/v1/pages` を追加し、固定ページ/投稿の publish 状態と slug 解決を API で検証可能化。  
- `/wp-json/creava/v1/ops/route-diagnostics` を追加。以下を 1 リクエストで返す:
  - permalink/rewrite 状態
  - `home/siteurl` 整合
  - page/post の slug 解決可否
  - reserved path / slug conflict 仮説

### 2-2. frontend / 運用側
- `frontend/src/modules/settings/wordpressOps.ts` に route diagnostics 取得関数を追加。  
- publish 後の verification で page/post slug を指定して route 診断を取得し、原因を固定化して記録できるようにした。  

## 3. 404 発生パターン切り分け（必須）
1. **WordPress URL 404 / API 200**  
   - server rewrite（Apache `.htaccess` / Nginx `try_files` / reverse proxy）を確認。
2. **WordPress API 404 / preview OK**  
   - publish state（draft/private）と slug/queryable を確認。
3. **WordPress API 200 / frontend 404**  
   - frontend route mapping / dynamic route precedence / locale prefix を確認。
4. **publish直後のみ404**  
   - revalidation と CDN cache purge の遅延（stale 404）を確認。

## 4. 調査コマンド（一次切り分け）
```bash
# permalink/rewrite + page/post slug 解決状態
curl -s "https://<wp-host>/wp-json/creava/v1/ops/route-diagnostics?pageSlug=<page-slug>&postSlug=<post-slug>" | jq

# 固定ページ / 投稿 API 解決（headless 経路）
curl -s "https://<wp-host>/wp-json/creava/v1/pages?slug=<page-slug>"
curl -s "https://<wp-host>/wp-json/creava/v1/posts?slug=<post-slug>"
```

## 5. publish 後 verification checklist
1. preview URL が表示できる。  
2. live URL（WordPress URL）が 200。  
3. headless frontend URL が 200。  
4. route diagnostics の `slugConflictRisk` / `reservedPathConflictRisk` が `none`。  
5. locale別 URL（ja/en/ko）で slug 解決が一致。  
6. sitemap/canonical が live URL と一致。  

## 6. 応急対応（恒久対応と分離）
1. permalink settings の保存（1回のみ）。  
2. plugin 再有効化で rewrite 再生成。  
3. CDN purge / revalidation 実行。  
4. slug conflict（reserved path）解消。  

## 7. 既知の未対応事項
- server 実体設定（Apache/Nginx/CDN）の環境差分は infra 側 runbookで継続管理。  
- locale prefix ごとの canonical 自動監査は次PRで追加可能。  

## 8. 仮定
- 本 runbook は `creava-platform-core` plugin が有効で、`/wp-json/creava/v1/*` が公開されている前提。  
- reverse proxy/CDN の実設定は環境依存のため、運用環境で最終確認が必要。  
