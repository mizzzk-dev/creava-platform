import type { CampaignSummary } from './types'

export function isCampaignActive(campaign: CampaignSummary, now = new Date()): boolean {
  const start = campaign.startAt ? new Date(campaign.startAt) : null
  const end = campaign.endAt ? new Date(campaign.endAt) : null
  if (start && now < start) return false
  if (end && now > end) return false
  return true
}

export function toCampaignCountdown(endAt: string | null): { label: string; urgent: boolean } | null {
  if (!endAt) return null
  const endMs = new Date(endAt).getTime()
  if (Number.isNaN(endMs)) return null
  const diff = endMs - Date.now()
  if (diff <= 0) return { label: '終了しました', urgent: false }
  const day = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hour = Math.floor((diff / (1000 * 60 * 60)) % 24)
  if (day > 0) return { label: `終了まで ${day}日`, urgent: day <= 2 }
  return { label: `終了まで ${hour}時間`, urgent: true }
}
