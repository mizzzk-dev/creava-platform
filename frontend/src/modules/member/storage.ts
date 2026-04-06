import type { MemberAccountSettings, MemberPreferences } from './types'

const STORAGE_KEY = 'creava.member.preferences'
const WITHDRAW_STORAGE_KEY = 'creava.member.withdraw-requested'
const ACCOUNT_STORAGE_KEY = 'creava.member.account-settings'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function loadMemberPreferences(): MemberPreferences | null {
  if (!canUseStorage()) return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as MemberPreferences
    if (typeof parsed.newsletterOptIn !== 'boolean' || typeof parsed.loginAlertOptIn !== 'boolean') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveMemberPreferences(preferences: MemberPreferences): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
}

export function loadWithdrawRequested(): boolean {
  if (!canUseStorage()) return false
  return window.localStorage.getItem(WITHDRAW_STORAGE_KEY) === '1'
}

export function saveWithdrawRequested(requested: boolean): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(WITHDRAW_STORAGE_KEY, requested ? '1' : '0')
}

const DEFAULT_ACCOUNT_SETTINGS: MemberAccountSettings = {
  profile: {
    displayName: '',
    email: '',
  },
  payments: [
    { id: 'card-main', label: 'Visa', summary: '**** 4242 / exp 12-30' },
    { id: 'card-sub', label: 'Mastercard', summary: '**** 4444 / exp 09-29' },
  ],
  shippings: [
    { id: 'home', label: '自宅', summary: '東京都渋谷区 / 150-0001' },
    { id: 'office', label: '仕事先', summary: '東京都港区 / 107-0001' },
  ],
}

export function loadMemberAccountSettings(): MemberAccountSettings {
  if (!canUseStorage()) return DEFAULT_ACCOUNT_SETTINGS
  const raw = window.localStorage.getItem(ACCOUNT_STORAGE_KEY)
  if (!raw) return DEFAULT_ACCOUNT_SETTINGS

  try {
    const parsed = JSON.parse(raw) as MemberAccountSettings
    if (!parsed || typeof parsed !== 'object') return DEFAULT_ACCOUNT_SETTINGS
    if (!parsed.profile || typeof parsed.profile.displayName !== 'string' || typeof parsed.profile.email !== 'string') {
      return DEFAULT_ACCOUNT_SETTINGS
    }
    if (!Array.isArray(parsed.payments) || !Array.isArray(parsed.shippings)) {
      return DEFAULT_ACCOUNT_SETTINGS
    }
    return parsed
  } catch {
    return DEFAULT_ACCOUNT_SETTINGS
  }
}

export function saveMemberAccountSettings(settings: MemberAccountSettings): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(settings))
}
