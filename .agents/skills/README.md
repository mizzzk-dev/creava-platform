# creava-platform repo-local skills

このディレクトリは `creava-platform` 専用の Skills セットです。  
原則は **1 skill = 1 job** です。

## Skill 担当一覧
- `repo-context`: 全体調査・docs差分把握
- `frontend-implementation`: frontend 実装
- `brand-design-polish`: デザイン磨き込み
- `store-experience`: store 導線/売り場改善
- `fanclub-experience`: fanclub 導線/制御改善
- `strapi-content-model`: Strapi schema 変更
- `api-fetch-hardening`: fetch/API 堅牢化
- `docs-and-runbook`: docs / runbook 更新
- `issue-pr-writer-ja`: 日本語PR/コミット整備
- `design-critique`: 実装後のUI批評

## 明示呼び出し例
- 「`$repo-context` で先に現状調査して」
- 「`$frontend-implementation` で Contact 周りを改修して」
- 「`$api-fetch-hardening` で HTML 応答混入を防いで」
- 「`$issue-pr-writer-ja` で PR 文面を整えて」

## 暗黙呼び出しされやすい task
- 仕様把握から開始する改善 → `repo-context`
- ページ改修・導線変更 → `frontend-implementation`
- schema/relations 変更 → `strapi-content-model`
- API 障害対策 → `api-fetch-hardening`
- docs 更新 → `docs-and-runbook`
- 見た目最終レビュー → `design-critique`

## 推奨の使い分け（順序）
1. `repo-context` で前提固定
2. 実装系 skill を1つ選んで実装
3. `design-critique` で仕上げ
4. `issue-pr-writer-ja` で提出物を整える

## AGENTS.md と skills の責務分担
- **AGENTS.md**: 全体優先順位、禁止事項、最低品質基準
- **skills**: タスク別の実行手順・出力形式
- **references/**: repo 固有の短い要約（再利用用）

## guidance 配置方針
- AGENTS に置く: 壊してはいけない原則、運用言語、最低コマンド
- skills に置く: 実装手順、チェックリスト、出力テンプレ
- docs に置く: 長文の設計方針・運用手順

## 今後 skills を増やすルール
- 追加条件: 反復発生する独立ジョブであること
- 禁止: 何でもできる巨大 skill
- 先に `references/` の更新で吸収できないか検討する
