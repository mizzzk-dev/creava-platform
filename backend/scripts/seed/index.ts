/**
 * Strapi Seed Script
 *
 * Usage:
 *   npm run seed --prefix backend
 *   # or from backend/ directory:
 *   npx ts-node scripts/seed/index.ts
 *
 * Prerequisites:
 *   1. Strapi content types must be defined (see docs/backend-setup.md)
 *   2. Strapi must NOT be running (this script starts its own instance)
 *
 * What this script does:
 *   - Loads fixture JSON files from ./fixtures/
 *   - Creates records via Strapi Entity Service API
 *   - Skips records that already exist (identified by slug or order)
 *   - Single types (Profile, SiteSettings) are created once; skip if data already exists
 *   - Reports counts at the end
 *
 * Collection types (9):
 *   api::work.work                       → fixtures/works.json           (16 items)
 *   api::news-item.news-item             → fixtures/news.json            (14 items)
 *   api::blog-post.blog-post             → fixtures/blog.json            (14 items)
 *   api::event.event                     → fixtures/events.json          (8 items)
 *   api::fanclub-content.fanclub-content → fixtures/fanclub.json         (12 items)
 *   api::store-product.store-product     → fixtures/store-products.json  (12 items)
 *   api::media-item.media-item           → fixtures/media-items.json     (10 items)
 *   api::award.award                     → fixtures/awards.json          (8 items)
 *   api::faq.faq                         → fixtures/faq.json             (14 items)
 *
 * Single types (2):
 *   api::profile.profile                 → fixtures/profile.json
 *   api::site-setting.site-setting       → fixtures/site-setting.json
 */

import path from 'path'
import fs from 'fs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SeedFixture {
  slug?: string
  order?: number
  [key: string]: unknown
}

interface SeedConfig {
  uid: string
  file: string
  label: string
}

interface SingleTypeSeedConfig {
  uid: string
  file: string
  label: string
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SEED_CONFIGS: SeedConfig[] = [
  { uid: 'api::work.work',                               file: 'works.json',          label: 'Works'          },
  { uid: 'api::news-item.news-item',                     file: 'news.json',           label: 'News'           },
  { uid: 'api::blog-post.blog-post',                     file: 'blog.json',           label: 'Blog'           },
  { uid: 'api::event.event',                             file: 'events.json',         label: 'Events'         },
  { uid: 'api::fanclub-content.fanclub-content',         file: 'fanclub.json',        label: 'Fanclub'        },
  { uid: 'api::store-product.store-product',             file: 'store-products.json', label: 'Store Products' },
  { uid: 'api::media-item.media-item',                   file: 'media-items.json',    label: 'Media Items'    },
  { uid: 'api::award.award',                             file: 'awards.json',         label: 'Awards'         },
  { uid: 'api::faq.faq',                                 file: 'faq.json',            label: 'FAQ'            },
]

const SINGLE_TYPE_CONFIGS: SingleTypeSeedConfig[] = [
  { uid: 'api::profile.profile',           file: 'profile.json',       label: 'Profile'       },
  { uid: 'api::site-setting.site-setting', file: 'site-setting.json',  label: 'Site Settings' },
]

const FIXTURES_DIR = path.join(__dirname, 'fixtures')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadFixture(filename: string): SeedFixture[] {
  const filepath = path.join(FIXTURES_DIR, filename)
  if (!fs.existsSync(filepath)) {
    console.warn(`  ⚠️  Fixture file not found: ${filepath}`)
    return []
  }
  const raw = fs.readFileSync(filepath, 'utf-8')
  return JSON.parse(raw) as SeedFixture[]
}

function loadSingleTypeFixture(filename: string): Record<string, unknown> | null {
  const filepath = path.join(FIXTURES_DIR, filename)
  if (!fs.existsSync(filepath)) {
    console.warn(`  ⚠️  Fixture file not found: ${filepath}`)
    return null
  }
  const raw = fs.readFileSync(filepath, 'utf-8')
  return JSON.parse(raw) as Record<string, unknown>
}

async function seedCollection(
  strapi: any,
  config: SeedConfig,
  fixtures: SeedFixture[],
): Promise<{ created: number; skipped: number; errors: number }> {
  let created = 0
  let skipped = 0
  let errors = 0

  for (const fixture of fixtures) {
    try {
      // Check for existing record by slug (or order for FAQ)
      const identifierField = fixture.slug ? 'slug' : 'order'
      const identifierValue = fixture.slug ?? fixture.order

      if (identifierValue !== undefined) {
        const existing = await strapi.entityService.findMany(config.uid, {
          filters: { [identifierField]: { $eq: identifierValue } },
          limit: 1,
        })

        if (existing && existing.length > 0) {
          skipped++
          continue
        }
      }

      await strapi.entityService.create(config.uid, {
        data: {
          ...fixture,
          publishedAt: fixture.publishAt ?? new Date().toISOString(),
        },
      })
      created++
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`    ✗ Failed to create record: ${JSON.stringify(fixture).slice(0, 80)}...`)
      console.error(`      ${message}`)
      errors++
    }
  }

  return { created, skipped, errors }
}

async function seedSingleType(
  strapi: any,
  config: SingleTypeSeedConfig,
  data: Record<string, unknown>,
): Promise<'created' | 'skipped' | 'error'> {
  try {
    // Single types: findMany returns an array with 0 or 1 records
    const existing = await strapi.entityService.findMany(config.uid, { limit: 1 })
    const hasData = Array.isArray(existing) ? existing.length > 0 : existing !== null && existing !== undefined

    if (hasData) {
      return 'skipped'
    }

    await strapi.entityService.create(config.uid, { data })
    return 'created'
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`    ✗ Failed to seed single type ${config.label}: ${message}`)
    return 'error'
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 Starting Strapi seed script...\n')

  // Strapi must be loaded as a library (not started as a server)
  const strapiFactory = require('@strapi/strapi')
  const strapiApp = strapiFactory.default({ appDir: path.join(__dirname, '../..') })

  try {
    await strapiApp.load()
    console.log('✅ Strapi loaded\n')

    const results: Record<string, { created: number; skipped: number; errors: number }> = {}

    // -------------------------------------------------------------------------
    // 1. Seed collection types
    // -------------------------------------------------------------------------
    console.log('── Collection Types ──────────────────────────────────')
    for (const config of SEED_CONFIGS) {
      const fixtures = loadFixture(config.file)
      if (fixtures.length === 0) {
        console.log(`  — ${config.label}: no fixtures loaded, skipping`)
        continue
      }

      console.log(`  → Seeding ${config.label} (${fixtures.length} fixtures)...`)
      const result = await seedCollection(strapiApp, config, fixtures)
      results[config.label] = result

      const parts: string[] = []
      if (result.created > 0) parts.push(`${result.created} created`)
      if (result.skipped > 0) parts.push(`${result.skipped} skipped`)
      if (result.errors > 0)  parts.push(`${result.errors} errors`)
      console.log(`     ${parts.join(', ')}`)
    }

    // -------------------------------------------------------------------------
    // 2. Seed single types
    // -------------------------------------------------------------------------
    console.log('\n── Single Types ──────────────────────────────────────')
    const singleTypeResults: Record<string, 'created' | 'skipped' | 'error'> = {}

    for (const config of SINGLE_TYPE_CONFIGS) {
      const data = loadSingleTypeFixture(config.file)
      if (!data) {
        console.log(`  — ${config.label}: no fixture loaded, skipping`)
        continue
      }

      console.log(`  → Seeding ${config.label}...`)
      const result = await seedSingleType(strapiApp, config, data)
      singleTypeResults[config.label] = result
      console.log(`     ${result}`)
    }

    // -------------------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------------------
    console.log('\n📊 Summary:')
    let totalCreated = 0
    let totalSkipped = 0
    let totalErrors = 0

    for (const [label, result] of Object.entries(results)) {
      console.log(`  ${label}: +${result.created} created, ${result.skipped} skipped, ${result.errors} errors`)
      totalCreated += result.created
      totalSkipped += result.skipped
      totalErrors  += result.errors
    }

    for (const [label, result] of Object.entries(singleTypeResults)) {
      console.log(`  ${label}: ${result}`)
      if (result === 'created') totalCreated++
      else if (result === 'skipped') totalSkipped++
      else if (result === 'error') totalErrors++
    }

    console.log(`\n  Total: ${totalCreated} created, ${totalSkipped} skipped, ${totalErrors} errors`)

    if (totalErrors > 0) {
      console.log('\n⚠️  Some records failed to create. Check docs/backend-setup.md')
      process.exit(1)
    } else {
      console.log('\n✅ Seed complete!')
    }
  } finally {
    await strapiApp.destroy()
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
