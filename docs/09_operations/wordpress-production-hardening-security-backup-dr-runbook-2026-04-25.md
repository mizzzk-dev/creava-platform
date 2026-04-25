# WordPress production hardening / security / backup / restore / observability / DR runbook（2026-04-25）

- 対象: `mizzz.jp` / `store.mizzz.jp` / `fc.mizzz.jp`
- 目的: **WordPress 単独運用を「公開できる状態」から「事故時に守れて戻せる状態」へ進める**。

- 次段の editorial ops / publish audit / search diagnostics / media governance は [WordPress editor dashboard parity / publish audit / search diagnostics / media dedupe / content quality runbook（2026-04-25）](./wordpress-editorial-ops-dashboard-publish-audit-search-media-quality-runbook-2026-04-25.md) を参照。
- スコープ: security hardening / backup & restore / update governance / observability / incident response / disaster recovery

## 0. 責務分離（最重要）
1. security hardening（侵入・悪用・漏えいを防ぐ）
2. backup（復旧素材を失わない）
3. restore（実際に戻せる）
4. update governance（更新事故を防ぐ）
5. observability（異常を先に検知する）
6. incident response（誰がどう動くか）
7. disaster recovery（壊れた後にどう戻すか）
8. rollback boundary（何をどこまで戻せるか）

> 「WordPress で公開できる」と「事故っても守れて戻せる」は別物として扱う。

---

## 1. 現在の WordPress production 運用リスク（棚卸し）

### 1-1. attack surface
- WordPress admin/login だけでなく、headless REST / preview verify / Stripe webhook / checkout endpoint も公開面。
- `permission_callback: __return_true` の route は、個別 callback 側の認可・レート制御が不十分だと攻撃面になり得る。

### 1-2. secrets / auth
- `WORDPRESS_PREVIEW_SECRET` / `WORDPRESS_HEADLESS_JWT_SECRET` / `STRIPE_WEBHOOK_SECRET` の漏えい時に影響が大きい。
- JWT bearer を使う endpoint は失効方針・rotation window を持たないと長期侵害リスクが残る。

### 1-3. backup / restore
- DB バックアップのみでは `uploads` / custom plugin / env / cron 設定が欠落し、完全復旧できない。
- restore drill を行わないと、RTO/RPO を満たせるか検証できない。

### 1-4. update governance
- plugin/theme/core 更新を本番直適用すると preview/publish/search/Stripe/membership が連鎖的に壊れる。
- custom plugin（`creava-platform-core`）のリリース境界が曖昧だと rollback 不全を起こす。

### 1-5. observability
- preview failure / publish failure / revalidation failure / webhook failure を同一カテゴリで扱うと初動が遅れる。
- alert routing が未定義だと「通知は飛ぶが誰も動かない」状態になる。

---

## 2. 今回の hardening 実装（コード）

### 2-1. 共通 security hardening モジュール
- `wordpress/wp-content/plugins/creava-platform-core/includes/security-hardening.php` を追加。
- 追加した概念 state:
  - `securityHardeningState`
  - `authHardeningState`
  - `restPermissionState`
  - `previewSecurityState`
  - `webhookSecurityState`
  - `mediaSecurityState`
  - `secretRotationState`
  - `pluginRiskState`
  - `vulnerabilityState`
  - `exposureState`
  - `securityTraceId`
  - `securityAuditedAt`
  - `securityHardenedAt`

### 2-2. REST / preview / webhook hardening
- 公開 API に origin allowlist + レート制御（transient）を追加。
- `preview/verify` で deny/success を security audit log に出力。
- Stripe webhook で replay 抑止（event id transient cache）を追加。
- checkout session/billing portal に公開 API hardening を適用。

### 2-3. media upload hardening
- `wp_handle_upload_prefilter` で MIME allowlist とファイルサイズ上限を追加。
- `CREAVA_MEDIA_ALLOWED_MIME_TYPES` / `CREAVA_MEDIA_MAX_UPLOAD_BYTES` で運用制御。

### 2-4. baseline hardening
- XML-RPC を既定で無効化（`CREAVA_DISABLE_XMLRPC=true`）。
- security header（`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`）を既定有効化。

---

## 3. backup / restore / retention / drill

### 3-1. backup policy（必須対象）
1. database（全テーブル）
2. `wp-content/uploads`
3. `wp-content/plugins`（特に `creava-platform-core`）
4. WordPress runtime config（`wp-config.php` 相当）
5. cron / scheduler 設定
6. infra 設定（WAF/CDN/Firewall rule export）

### 3-2. retention policy
- Daily: 35世代
- Weekly: 12世代
- Monthly: 12世代
- 暗号化: at-rest / in-transit 必須
- 格納先: primary + cross-region secondary（二重化）

### 3-3. restore readiness
- 復旧単位は「file 単体」ではなく「environment 単位（wp + db + uploads + config）」。
- `restore verification checklist` を runbook に固定:
  - preview verify 成功
  - publish/revalidation 成功
  - discovery search 応答
  - Stripe webhook 疎通
  - membership gating（`fc_only` / `limited`）確認

### 3-4. restore drill
- frequency: 月1回（最低）
- drill 成果物:
  - 実施日時
  - 担当者
  - 復旧所要時間
  - fail/success と原因
  - 次回修正 TODO

### 3-5. RPO / RTO
- RPO（目標）: 15分以内
- RTO（目標）: 60分以内
- 未達時は incident 扱いで post-incident review を必須化。

---

## 4. update governance（core / plugin / theme / custom plugin）

### 4-1. update lanes
- lane A: 緊急 security patch（fast-track）
- lane B: 機能更新（通常）

### 4-2. 必須フロー
1. dependency inventory 更新
2. staging apply
3. smoke test（preview/publish/search/Stripe/membership）
4. operator review
5. production rollout（メンテナンス window）
6. 観測 window（最低24h）

### 4-3. rollback boundary
- L1: plugin 単体 rollback
- L2: WordPress core rollback
- L3: infra 設定 rollback
- L4: full environment restore

---

## 5. observability / monitoring / alerting / audit

### 5-1. monitor categories
1. REST API（latency / 4xx / 5xx）
2. preview verify（401/429 急増）
3. publish/revalidation（失敗率）
4. search（zero-result anomaly）
5. Stripe（checkout / portal / webhook）
6. membership gating（誤許可・誤拒否）
7. backup/restore（ジョブ失敗）

### 5-2. alert severity
- Sev1: checkout/webhook 全断、preview/publish 全断、restore 失敗
- Sev2: 部分劣化（error rate 閾値超過）
- Sev3: 低優先 anomaly（継続監視）

### 5-3. ownership
- Primary: CMS運用責任者
- Secondary: backend on-call
- Escalation: frontend lead → ops lead

---

## 6. incident response / disaster recovery

### 6-1. 初動テンプレ（障害種別別）
- preview 障害: secret/callback/origin/rate-limit の順に確認
- publish 障害: workflow freeze → revalidation queue を確認
- Stripe 障害: webhook署名/重複/retry queue を確認
- membership 障害: entitlement 同期と `accessStatus` 判定を確認
- search 障害: index source と locale/taxonomy 混線を確認

### 6-2. disaster recovery
1. incident declaration
2. publish freeze
3. 復旧モード（restore / rollback）選択
4. restoration 実行
5. verification checklist 実施
6. service reopen
7. PIR（24h以内）

### 6-3. communication
- status page 更新テンプレを事前用意
- internal / external の連絡文面を分離

---

## 7. env / secrets / runtime 整理

### 7-1. WordPress runtime env（新規/確認）
- `CREAVA_ALLOWED_ORIGINS`
- `CREAVA_PUBLIC_RATE_LIMIT`
- `CREAVA_PUBLIC_RATE_WINDOW_SEC`
- `CREAVA_DISABLE_XMLRPC`
- `CREAVA_ENABLE_SECURITY_HEADERS`
- `CREAVA_MEDIA_ALLOWED_MIME_TYPES`
- `CREAVA_MEDIA_MAX_UPLOAD_BYTES`
- `CREAVA_SECURITY_AUDIT_LOG`
- `WORDPRESS_PREVIEW_SECRET`
- `WORDPRESS_HEADLESS_JWT_SECRET`
- `STRIPE_WEBHOOK_SECRET`

### 7-2. secrets governance
- GitHub Secrets（CI）と runtime env（サーバ）を分離。
- frontend へ secret を露出しない（preview secret, JWT secret, webhook secret は server only）。
- rotation cadence: 90日（高リスク secret は30日）。

---

## 8. 実行コマンド

```bash
# hardening readiness audit
node scripts/migration/wordpress-production-readiness-audit.mjs

# frontend/backend build
npm run build:frontend
npm run build:backend
```

---

## 9. 残課題（次PR）
1. restore drill 実測ログの自動集約
2. dashboard 可視化（preview/publish/webhook/search を1画面化）
3. plugin dependency SBOM の自動生成
4. WAF/bot mitigation の定量チューニング

---

## 10. 仮定
1. WordPress 実行環境で transient/cache が利用可能。
2. production の WAF/CDN 管理権限は ops team が保有。
3. Stripe webhook は単一 endpoint に集約されている。
4. restore drill 用 staging 環境は production 同等構成で維持される。
