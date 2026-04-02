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
 *   3. STRAPI_ADMIN_EMAIL + STRAPI_ADMIN_PASSWORD must be set (optional, for admin creation)
 *
 * What this script does:
 *   - Loads fixture JSON files from ./fixtures/
 *   - Creates records via Strapi Entity Service API
 *   - Skips records that already exist (identified by slug)
 *   - Reports counts at the end
 *
 * Supported content types (Strapi collection API IDs):
 *   api::work.work                     → fixtures/works.json
 *   api::news-item.news-item           → fixtures/news.json
 *   api::blog-post.blog-post           → fixtures/blog.json
 *   api::event.event                   → fixtures/events.json
 *   api::fanclub-content.fanclub-content → fixtures/fanclub.json
 *   api::store-product.store-product   → fixtures/store-products.json
 *   api::media-item.media-item         → fixtures/media-items.json
 *   api::award.award                   → fixtures/awards.json
 *   api::faq.faq                       → fixtures/faq.json
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 Starting Strapi seed script...\n')

  // Strapi must be loaded as a library (not started as a server)
  // This is the standard approach for Strapi v5 seed scripts
  const strapiFactory = require('@strapi/strapi')
  const strapiApp = strapiFactory.default({ appDir: path.join(__dirname, '../..') })

  try {
    await strapiApp.load()
    console.log('✅ Strapi loaded\n')

    const results: Record<string, { created: number; skipped: number; errors: number }> = {}

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
    console.log(`\n  Total: ${totalCreated} created, ${totalSkipped} skipped, ${totalErrors} errors`)

    if (totalErrors > 0) {
      console.log('\n⚠️  Some records failed to create. Check content type definitions in docs/backend-setup.md')
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
