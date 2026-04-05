import fs from 'node:fs'
import path from 'node:path'

const baseDir = path.resolve('src/locales')
const localeFiles = ['ja/common.json', 'en/common.json', 'ko/common.json']

function flattenKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => {
    const next = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value, next)
    }
    return [next]
  })
}

const loaded = localeFiles.map((file) => {
  const full = path.join(baseDir, file)
  const data = JSON.parse(fs.readFileSync(full, 'utf8'))
  return { file, keys: new Set(flattenKeys(data)) }
})

const master = loaded.find((item) => item.file.startsWith('ja/'))
if (!master) {
  throw new Error('ja/common.json が見つかりません。')
}

let hasError = false

for (const locale of loaded) {
  if (locale.file === master.file) continue

  const missing = [...master.keys].filter((key) => !locale.keys.has(key))
  if (missing.length > 0) {
    hasError = true
    console.error(`\n[${locale.file}] 欠落キー: ${missing.length}`)
    for (const key of missing.slice(0, 30)) {
      console.error(` - ${key}`)
    }
    if (missing.length > 30) {
      console.error(` ... and ${missing.length - 30} more`)
    }
  }
}

if (hasError) {
  process.exit(1)
}

console.log('i18nキー整合チェック: OK')
