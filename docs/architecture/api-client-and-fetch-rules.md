# APIクライアント / fetch ルール

## 防御必須項目
- `response.ok` を必ず検査。
- `content-type` を検証し、`application/json` 以外はエラー化。
- HTML 応答混入（`<!doctype html>`, `<html`）を検知して専用メッセージ化。
- timeout と retry（指数バックオフ）を導入。
- stale cache や fallback で初回読み込み失敗に耐性を持たせる。

## UX ルール
- エラー文は「次に何をすべきか」を示す。
- 再試行導線を UI に用意。
- 障害時でもページ全体が空白にならないよう degrade する。

## 実装先
- 既存の `frontend/src/lib/api/client.ts` を起点に共通化し、各 module API で重複実装しない。
