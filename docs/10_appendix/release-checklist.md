# リリースチェックリスト

- 更新日: 2026-04-10
- 対象: リリース担当
- 目的: 手戻りの多い確認を定型化
- 前提: frontend/backend 両方の反映が必要な場合あり
- 関連ドキュメント: [test-specification](../08_test/test-specification.md)

## チェック項目

- [ ] `npm run test:frontend` が成功
- [ ] `npm run lint --prefix frontend` が成功
- [ ] `npm run build:frontend` が成功
- [ ] `npm run build:backend` が成功
- [ ] main/store/fc 主要ページ目視
- [ ] Contact/Request 送信動作確認
- [ ] accessStatus 制御確認（public/fc_only/limited）
- [ ] Stripe checkout 遷移確認（テスト環境）
- [ ] i18nキー欠落なし
- [ ] ダークモード崩れなし
- [ ] PRメタデータ（種別・優先度・領域）記載
