# Strapi 境界ルール

## 対象
- `backend/src/api/*`: content-type / route / controller / service
- `backend/config/*`: cors/db/middleware/server

## 原則
- content-type 変更時は relation / populate / Draft-Publish の影響を同時確認。
- 公開状態（public/fc_only/limited）と archive 制御を壊さない。
- 問い合わせ公開エンドポイントは互換性を維持する。

## 変更時の必須確認
- frontend の endpoint 呼び出しと型が一致する。
- seed データで主要画面が成立する。
- CORS と auth 設定が main/store/fc のオリジンをカバーする。
