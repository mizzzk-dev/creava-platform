import type { SeasonalSite } from '@/modules/seasonal/types'

const NEWYEAR_VISIT_KEY_PREFIX = 'mizzz.newyear.first_visit.'
const OMIKUJI_RESULT_KEY_PREFIX = 'mizzz.omikuji.result.'

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // noop
  }
}

export function isFirstNewYearVisit(site: SeasonalSite, year = new Date().getFullYear()): boolean {
  if (typeof window === 'undefined') return false
  const key = `${NEWYEAR_VISIT_KEY_PREFIX}${year}.${site}`
  return safeGetItem(key) !== '1'
}

export function markNewYearVisited(site: SeasonalSite, year = new Date().getFullYear()): void {
  if (typeof window === 'undefined') return
  const key = `${NEWYEAR_VISIT_KEY_PREFIX}${year}.${site}`
  safeSetItem(key, '1')
}

export function getOmikujiResult(site: SeasonalSite, year = new Date().getFullYear()): string | null {
  if (typeof window === 'undefined') return null
  const key = `${OMIKUJI_RESULT_KEY_PREFIX}${year}.${site}`
  return safeGetItem(key)
}

export function setOmikujiResult(site: SeasonalSite, result: string, year = new Date().getFullYear()): void {
  if (typeof window === 'undefined') return
  const key = `${OMIKUJI_RESULT_KEY_PREFIX}${year}.${site}`
  safeSetItem(key, result)
}
