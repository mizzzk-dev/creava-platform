import type { MemberAccountSettings, MemberPaymentSettings, MemberPreferences, MemberShippingSettings } from './types'

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
    userId: 'guest-user',
    displayName: '',
    email: '',
  },
  payments: [
    { id: 'card-main', label: 'メインカード', cardholderName: 'TARO YAMADA', cardNumber: '4242424242424242', expiryMonth: '12', expiryYear: '30' },
    { id: 'card-sub', label: 'サブカード', cardholderName: 'TARO YAMADA', cardNumber: '5555555555554444', expiryMonth: '09', expiryYear: '29' },
  ],
  shippings: [
    { id: 'home', label: '自宅', postalCode: '1500001', prefecture: '東京都', city: '渋谷区', addressLine: '神宮前1-1-1', building: '' },
    { id: 'office', label: '仕事先', postalCode: '1070001', prefecture: '東京都', city: '港区', addressLine: '北青山2-2-2', building: '青山ビル 5F' },
  ],
}

function normalizePayment(payment: Partial<MemberPaymentSettings> & { id: string }): MemberPaymentSettings {
  const legacySummary = typeof (payment as { summary?: unknown }).summary === 'string' ? String((payment as { summary?: string }).summary) : ''
  const legacyCardNumber = legacySummary.replace(/\D/g, '').slice(-16)
  const [legacyExpiryRaw = ''] = legacySummary.split('/')
  const [legacyMonth = '', legacyYear = ''] = legacyExpiryRaw.trim().split('-')

  return {
    id: payment.id,
    label: typeof payment.label === 'string' ? payment.label : 'カード',
    cardholderName: typeof payment.cardholderName === 'string' ? payment.cardholderName : '',
    cardNumber: typeof payment.cardNumber === 'string' ? payment.cardNumber.replace(/\D/g, '').slice(0, 16) : legacyCardNumber,
    expiryMonth: typeof payment.expiryMonth === 'string' ? payment.expiryMonth.replace(/\D/g, '').slice(0, 2) : legacyMonth,
    expiryYear: typeof payment.expiryYear === 'string' ? payment.expiryYear.replace(/\D/g, '').slice(0, 2) : legacyYear,
  }
}

function normalizeShipping(shipping: Partial<MemberShippingSettings> & { id: string }): MemberShippingSettings {
  const legacySummary = typeof (shipping as { summary?: unknown }).summary === 'string' ? String((shipping as { summary?: string }).summary) : ''
  const legacyPostal = legacySummary.match(/\d{3}-?\d{4}/)?.[0]?.replace(/\D/g, '') ?? ''

  return {
    id: shipping.id,
    label: typeof shipping.label === 'string' ? shipping.label : '配送先',
    postalCode: typeof shipping.postalCode === 'string' ? shipping.postalCode.replace(/\D/g, '').slice(0, 7) : legacyPostal,
    prefecture: typeof shipping.prefecture === 'string' ? shipping.prefecture : '',
    city: typeof shipping.city === 'string' ? shipping.city : '',
    addressLine: typeof shipping.addressLine === 'string' ? shipping.addressLine : '',
    building: typeof shipping.building === 'string' ? shipping.building : '',
  }
}

export function loadMemberAccountSettings(): MemberAccountSettings {
  if (!canUseStorage()) return DEFAULT_ACCOUNT_SETTINGS
  const raw = window.localStorage.getItem(ACCOUNT_STORAGE_KEY)
  if (!raw) return DEFAULT_ACCOUNT_SETTINGS

  try {
    const parsed = JSON.parse(raw) as Partial<MemberAccountSettings>
    if (!parsed || typeof parsed !== 'object') return DEFAULT_ACCOUNT_SETTINGS

    const profile = parsed.profile && typeof parsed.profile === 'object'
      ? {
          userId: typeof parsed.profile.userId === 'string' ? parsed.profile.userId : DEFAULT_ACCOUNT_SETTINGS.profile.userId,
          displayName: typeof parsed.profile.displayName === 'string' ? parsed.profile.displayName : '',
          email: typeof parsed.profile.email === 'string' ? parsed.profile.email : '',
        }
      : DEFAULT_ACCOUNT_SETTINGS.profile

    const payments = Array.isArray(parsed.payments)
      ? parsed.payments
        .filter((payment) => typeof (payment as { id?: unknown })?.id === 'string')
        .map((payment) => normalizePayment(payment as Partial<MemberPaymentSettings> & { id: string }))
      : DEFAULT_ACCOUNT_SETTINGS.payments

    const shippings = Array.isArray(parsed.shippings)
      ? parsed.shippings
        .filter((shipping) => typeof (shipping as { id?: unknown })?.id === 'string')
        .map((shipping) => normalizeShipping(shipping as Partial<MemberShippingSettings> & { id: string }))
      : DEFAULT_ACCOUNT_SETTINGS.shippings

    return {
      profile,
      payments: payments.length > 0 ? payments : DEFAULT_ACCOUNT_SETTINGS.payments,
      shippings: shippings.length > 0 ? shippings : DEFAULT_ACCOUNT_SETTINGS.shippings,
    }
  } catch {
    return DEFAULT_ACCOUNT_SETTINGS
  }
}

export function saveMemberAccountSettings(settings: MemberAccountSettings): void {
  if (!canUseStorage()) return
  window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(settings))
}
