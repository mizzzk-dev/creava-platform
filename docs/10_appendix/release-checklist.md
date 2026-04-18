# リリースチェックリスト

- 更新日: 2026-04-18
- 対象: リリース担当
- 目的: 本番公開事故を減らし、切り戻し判断を早める
- 前提: frontend/backend 両方の反映が必要な場合あり
- 関連: [production-reliability-runbook](../09_operations/production-reliability-runbook.md), [test-specification](../08_test/test-specification.md)

## 1. リリース前（必須）

- [ ] `npm run test:frontend` が成功
- [ ] `npm run lint --prefix frontend` が成功
- [ ] `npm run build:frontend` が成功
- [ ] `npm run build:backend` が成功
- [ ] main / store / fc の主要導線を確認
- [ ] Contact / Request / Restock 送信動作を確認
- [ ] auth callback / logout 動作を確認
- [ ] upload 制御（サイズ / MIME）を確認
- [ ] FAQ / Guide / News / Blog / Events の表示確認
- [ ] 多言語（ja/en/ko）確認
- [ ] light / dark 確認
- [ ] mobile（主要導線）確認
- [ ] SEO metadata / canonical / OGP を確認
- [ ] `/_health` と `/_ready` 応答を確認
- [ ] rate-limit / error ログを確認
- [ ] monitoring workflow の対象 URL が最新であることを確認

## 2. リリース後（15分以内）

- [ ] synthetic monitoring が成功している
- [ ] 問い合わせ送信に失敗が増えていない
- [ ] 認証失敗が急増していない
- [ ] 5xx / 429 が異常増加していない

## 3. 失敗時の切り戻し

- [ ] frontend: 直前安定コミットを再デプロイ
- [ ] backend: 直前安定版へ戻す
- [ ] 必要時 DB/media を restore
- [ ] 切り戻し後に `/_ready` と主要導線の再確認

## 4. PRメタデータ

- [ ] type / priority / areas / labels / risks / not_done を記載
