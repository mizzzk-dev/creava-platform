#!/usr/bin/env node
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import crypto from 'node:crypto'

const root = resolve(process.cwd())

function load(file) {
  const p = resolve(root, file)
  if (!existsSync(p)) return ''
  return readFileSync(p, 'utf8')
}

function has(content, pattern) {
  return pattern.test(content)
}

const restContent = load('wordpress/wp-content/plugins/creava-platform-core/includes/rest-content.php')
const restStripe = load('wordpress/wp-content/plugins/creava-platform-core/includes/rest-stripe.php')
const webhook = load('wordpress/wp-content/plugins/creava-platform-core/includes/stripe-webhook.php')
const security = load('wordpress/wp-content/plugins/creava-platform-core/includes/security-hardening.php')
const envDoc = load('docs/10_appendix/environment-variables.md')
const runbook = load('docs/09_operations/wordpress-production-hardening-security-backup-dr-runbook-2026-04-25.md')

const checks = [
  {
    id: 'security_hardening_module',
    severity: 'critical',
    state: has(security, /creava_security_validate_public_rest_request/) ? 'ready' : 'missing',
    description: 'REST / webhook / preview で共通 hardening 関数が定義されているか',
  },
  {
    id: 'preview_secret_validation',
    severity: 'high',
    state: has(restContent, /invalid_preview_secret/) && has(restContent, /creava_security_validate_public_rest_request/) ? 'ready' : 'missing',
    description: 'preview verify で secret + レート制御を実施しているか',
  },
  {
    id: 'stripe_webhook_signature_and_replay',
    severity: 'critical',
    state: has(webhook, /creava_verify_stripe_signature/) && has(webhook, /creava_security_is_replayed_webhook/) ? 'ready' : 'missing',
    description: 'Stripe webhook で署名検証と replay 抑止を実施しているか',
  },
  {
    id: 'stripe_checkout_guard',
    severity: 'high',
    state: has(restStripe, /creava_security_validate_public_rest_request\(\$request, 'stripe_checkout_session'/) ? 'ready' : 'missing',
    description: 'checkout session API が公開エンドポイント hardening を通るか',
  },
  {
    id: 'media_upload_guard',
    severity: 'high',
    state: has(security, /wp_handle_upload_prefilter/) ? 'ready' : 'missing',
    description: 'media upload の MIME / size guard があるか',
  },
  {
    id: 'runbook_hardening_foundation',
    severity: 'critical',
    state: has(runbook, /backup \/ restore/) && has(runbook, /incident response/) ? 'ready' : 'missing',
    description: 'security/backup/restore/incident を分離した runbook があるか',
  },
  {
    id: 'env_and_secret_guide',
    severity: 'medium',
    state: has(envDoc, /CREAVA_ALLOWED_ORIGINS/) && has(envDoc, /WORDPRESS_PREVIEW_SECRET/) ? 'ready' : 'missing',
    description: 'hardening 用 env/secrets の設定手順が docs 化されているか',
  },
]

const summary = {
  total: checks.length,
  ready: checks.filter((c) => c.state === 'ready').length,
  missing: checks.filter((c) => c.state !== 'ready').length,
}

const readiness = summary.missing === 0 ? 'ready' : summary.ready >= summary.total - 1 ? 'partial' : 'at_risk'
const now = new Date().toISOString()
const report = {
  wordpressProductionHardeningState: readiness,
  backupRestoreReadinessState: has(runbook, /restore drill/) ? 'documented' : 'needs_followup',
  updateGovernanceState: has(runbook, /update governance/) ? 'documented' : 'needs_followup',
  observabilityState: has(runbook, /observability/) ? 'documented' : 'needs_followup',
  incidentReadinessState: has(runbook, /disaster recovery/) ? 'documented' : 'needs_followup',
  reportTraceId: crypto.randomUUID(),
  auditedAt: now,
  summary,
  checks,
}

const out = resolve(root, 'reports/wordpress-production-readiness-audit.json')
writeFileSync(out, JSON.stringify(report, null, 2))
console.log(`wrote ${out}`)
console.log(JSON.stringify(report, null, 2))
