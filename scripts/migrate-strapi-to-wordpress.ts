#!/usr/bin/env node
/* eslint-disable no-console */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

type ContentType = 'blog-posts' | 'news-items' | 'events' | 'works' | 'store-products' | 'fanclub-contents'

type MappingItem = {
  source: ContentType
  sourceId: number | string
  sourceSlug: string
  locale: string
  target: string
  targetId?: number | string
  targetSlug?: string
  status: 'pending' | 'migrated' | 'failed' | 'verified'
  message?: string
}

type MappingFile = {
  version: number
  generatedAt: string
  items: MappingItem[]
}

type CliOptions = {
  dryRun: boolean
  verifyOnly: boolean
  type?: ContentType
  locale?: string
  limit?: number
  reportPath: string
}

const CONTENT_TYPES: Array<{ strapi: ContentType; wordpress: string; route: string }> = [
  { strapi: 'blog-posts', wordpress: 'blog', route: 'blog' },
  { strapi: 'news-items', wordpress: 'news', route: 'news' },
  { strapi: 'events', wordpress: 'event', route: 'events' },
  { strapi: 'works', wordpress: 'work', route: 'works' },
  { strapi: 'store-products', wordpress: 'store_product', route: 'store-products' },
  { strapi: 'fanclub-contents', wordpress: 'fanclub_content', route: 'fanclub-contents' },
]

const ROOT = process.cwd()
const MAPPING_PATH = resolve(ROOT, 'scripts/migration/mapping.json')

function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const options: CliOptions = {
    dryRun: args.includes('--dry-run'),
    verifyOnly: args.includes('--verify-only'),
    reportPath: resolve(ROOT, `scripts/migration/reports/migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`),
  }

  for (const arg of args) {
    if (arg.startsWith('--type=')) options.type = arg.replace('--type=', '') as ContentType
    if (arg.startsWith('--locale=')) options.locale = arg.replace('--locale=', '')
    if (arg.startsWith('--limit=')) options.limit = Number(arg.replace('--limit=', ''))
    if (arg.startsWith('--report=')) options.reportPath = resolve(ROOT, arg.replace('--report=', ''))
  }

  return options
}

function getEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} が未設定です`)
  return v.replace(/\/$/, '')
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const text = await res.text()
  let json: unknown
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(`JSONパース失敗: ${url} body=${text.slice(0, 180)}`)
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${url} ${text.slice(0, 180)}`)
  }

  return json as T
}

function readMapping(): MappingFile {
  try {
    return JSON.parse(readFileSync(MAPPING_PATH, 'utf-8')) as MappingFile
  } catch {
    return { version: 1, generatedAt: new Date().toISOString(), items: [] }
  }
}

function writeMapping(mapping: MappingFile): void {
  writeFileSync(MAPPING_PATH, `${JSON.stringify(mapping, null, 2)}\n`)
}

function upsertMappingItem(mapping: MappingFile, next: MappingItem): void {
  const index = mapping.items.findIndex((item) => item.source === next.source && item.sourceId === next.sourceId && item.locale === next.locale)
  if (index >= 0) {
    mapping.items[index] = next
  } else {
    mapping.items.push(next)
  }
}

function buildStrapiUrl(base: string, type: ContentType, locale?: string, page = 1, pageSize = 100): string {
  const qs = new URLSearchParams()
  qs.set('pagination[page]', String(page))
  qs.set('pagination[pageSize]', String(pageSize))
  qs.set('sort[0]', 'updatedAt:desc')
  if (locale) qs.set('locale', locale)
  return `${base}/api/${type}?${qs.toString()}`
}

async function fetchStrapiCollection(base: string, token: string, type: ContentType, locale?: string, limit?: number): Promise<any[]> {
  const items: any[] = []
  let page = 1
  while (true) {
    const url = buildStrapiUrl(base, type, locale, page)
    const response = await fetchJson<{ data: any[]; meta?: { pagination?: { pageCount?: number } } }>(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
    items.push(...(response.data ?? []))
    if (limit && items.length >= limit) return items.slice(0, limit)

    const pageCount = response.meta?.pagination?.pageCount ?? 1
    if (page >= pageCount) break
    page += 1
  }
  return items
}

function toWordPressPayload(item: any): Record<string, unknown> {
  const attr = item.attributes ?? item
  const title = attr.title ?? attr.name ?? `migrated-${item.id}`
  return {
    title,
    slug: attr.slug ?? `strapi-${item.id}`,
    body: attr.body ?? attr.description ?? '',
    excerpt: attr.excerpt ?? '',
    accessStatus: attr.accessStatus ?? 'public',
    publishAt: attr.publishAt ?? attr.publishedAt ?? null,
    updatedAt: attr.updatedAt ?? null,
    locale: attr.locale ?? 'ja',
  }
}

function buildWordPressWriteUrl(base: string, route: string): string {
  return `${base}/wp-json/creava/v1/migration/${route}`
}

async function pushToWordPress(base: string, appToken: string, route: string, payload: Record<string, unknown>, dryRun: boolean): Promise<{ id?: number; slug?: string }> {
  if (dryRun) return { id: undefined, slug: String(payload.slug ?? '') }
  return fetchJson<{ id?: number; slug?: string }>(buildWordPressWriteUrl(base, route), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${appToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })
}

function classifyMismatch(source: any, target: any): string[] {
  const mismatches: string[] = []
  if (!target) return ['missing_target']
  if ((source.slug ?? '') !== (target.slug ?? '')) mismatches.push('slug')
  if ((source.locale ?? 'ja') !== (target.locale ?? 'ja')) mismatches.push('locale')
  if ((source.accessStatus ?? 'public') !== (target.accessStatus ?? 'public')) mismatches.push('accessStatus')
  return mismatches
}

async function verifyParity(base: string, route: string, sourceItems: any[]): Promise<{ ok: number; ng: number; mismatches: Array<{ slug: string; reasons: string[] }> }> {
  const wp = await fetchJson<{ data: any[] }>(`${base}/wp-json/creava/v1/${route}?page=1&pageSize=200`)
  const bySlug = new Map((wp.data ?? []).map((item) => [item.slug, item]))
  let ok = 0
  let ng = 0
  const mismatches: Array<{ slug: string; reasons: string[] }> = []

  for (const source of sourceItems) {
    const normalized = toWordPressPayload(source)
    const target = bySlug.get(String(normalized.slug ?? ''))
    const reasons = classifyMismatch(normalized, target)
    if (reasons.length === 0) ok += 1
    else {
      ng += 1
      mismatches.push({ slug: String(normalized.slug ?? ''), reasons })
    }
  }

  return { ok, ng, mismatches }
}

async function main(): Promise<void> {
  const options = parseArgs()
  const strapiBase = getEnv('STRAPI_MIGRATION_SOURCE_URL')
  const strapiToken = getEnv('STRAPI_MIGRATION_SOURCE_TOKEN')
  const wordpressBase = getEnv('WORDPRESS_MIGRATION_TARGET_URL')
  const wordpressToken = getEnv('WORDPRESS_MIGRATION_APP_TOKEN')

  const mapping = readMapping()
  const report: Record<string, unknown> = {
    startedAt: new Date().toISOString(),
    options,
    results: [],
    verify: [],
  }

  const targets = CONTENT_TYPES.filter((contentType) => !options.type || options.type === contentType.strapi)

  for (const target of targets) {
    console.log(`[migration] ${target.strapi} -> ${target.wordpress} start`)
    const sourceItems = await fetchStrapiCollection(strapiBase, strapiToken, target.strapi, options.locale, options.limit)
    let migrated = 0
    let failed = 0

    if (!options.verifyOnly) {
      for (const sourceItem of sourceItems) {
        const normalized = toWordPressPayload(sourceItem)
        try {
          const migratedEntity = await pushToWordPress(wordpressBase, wordpressToken, target.route, normalized, options.dryRun)
          upsertMappingItem(mapping, {
            source: target.strapi,
            sourceId: sourceItem.id,
            sourceSlug: String(normalized.slug ?? ''),
            locale: String(normalized.locale ?? 'ja'),
            target: target.wordpress,
            targetId: migratedEntity.id,
            targetSlug: migratedEntity.slug ?? String(normalized.slug ?? ''),
            status: options.dryRun ? 'pending' : 'migrated',
          })
          migrated += 1
        } catch (error) {
          upsertMappingItem(mapping, {
            source: target.strapi,
            sourceId: sourceItem.id,
            sourceSlug: String(normalized.slug ?? ''),
            locale: String(normalized.locale ?? 'ja'),
            target: target.wordpress,
            status: 'failed',
            message: error instanceof Error ? error.message : String(error),
          })
          failed += 1
        }
      }
    }

    const verify = await verifyParity(wordpressBase, target.route, sourceItems)
    ;(report.results as Array<Record<string, unknown>>).push({
      source: target.strapi,
      target: target.wordpress,
      total: sourceItems.length,
      migrated,
      failed,
    })
    ;(report.verify as Array<Record<string, unknown>>).push({
      source: target.strapi,
      ok: verify.ok,
      ng: verify.ng,
      mismatches: verify.mismatches.slice(0, 100),
    })

    console.log(`[migration] ${target.strapi} done total=${sourceItems.length} migrated=${migrated} failed=${failed} verify_ng=${verify.ng}`)
  }

  mapping.generatedAt = new Date().toISOString()
  writeMapping(mapping)

  mkdirSync(resolve(ROOT, 'scripts/migration/reports'), { recursive: true })
  writeFileSync(options.reportPath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`[migration] report written: ${options.reportPath}`)
}

main().catch((error) => {
  console.error('[migration] failed', error)
  process.exit(1)
})
