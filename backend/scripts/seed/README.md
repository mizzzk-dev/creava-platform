# Seed Script

Populates Strapi with test data from the `fixtures/` directory.

## Prerequisites

1. **Content types defined** — All collection types must exist in Strapi admin (see `docs/backend-setup.md`).
2. **Strapi not running** — The script loads Strapi as a library. Stop the dev server first.
3. **Database initialized** — Run `npm run develop --prefix backend` at least once to create the SQLite database.

## Usage

```bash
# From repo root
npm run seed:backend

# From backend/ directory
npm run seed
```

## Fixtures

| File | Content type UID | Records |
|------|-----------------|---------|
| `works.json` | `api::work.work` | 14 |
| `news.json` | `api::news.news` | 12 |
| `blog.json` | `api::blog-post.blog-post` | 12 |
| `events.json` | `api::event.event` | 8 |
| `fanclub.json` | `api::fanclub-post.fanclub-post` | 12 |
| `store-products.json` | `api::store-product.store-product` | 12 |
| `media.json` | `api::medium.medium` | 10 |
| `faq.json` | `api::faq.faq` | 14 |

## Data Variety

Each fixture set covers the following `status` values to test frontend visibility logic:

- **`public`** — visible to all visitors
- **`fc_only`** — visible to fan club members only
- **`limited`** — visible within `publishAt`–`limitedEndAt` window; `archiveVisibleForFC: true` items remain visible to FC members after expiry

## Re-seeding

The script skips records that already exist (matched by `slug`). To re-seed from scratch:

```bash
# Delete the SQLite database
rm backend/.tmp/data.db

# Restart Strapi to recreate the schema
npm run develop --prefix backend
# (Ctrl+C after it finishes initializing)

# Run seed
npm run seed:backend
```

## Adding New Fixtures

1. Add a JSON file to `fixtures/`
2. Add an entry to `SEED_CONFIGS` in `index.ts`
3. Ensure the content type is defined in Strapi
