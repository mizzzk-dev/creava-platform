import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/routeConstants'
import { trackMizzzEvent } from '@/modules/analytics/tracking'
import type { PrivacySummary } from '@/modules/member/api'

type Props = {
  summary: PrivacySummary
  onSaveConsent: (next: Pick<PrivacySummary, 'notificationConsentState' | 'crmConsentState' | 'analyticsConsentState'>) => Promise<void>
  onRequestExport: () => Promise<void>
  onRequestCancellation: () => Promise<void>
  onRequestDeletion: () => Promise<void>
}

export default function PrivacyCenterPanel({ summary, onSaveConsent, onRequestExport, onRequestCancellation, onRequestDeletion }: Props) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    trackMizzzEvent('privacy_center_view', { source: 'member_page' })
    trackMizzzEvent('consent_settings_view', { source: 'member_page' })
  }, [])

  const save = async (key: 'notificationConsentState' | 'crmConsentState' | 'analyticsConsentState', value: string) => {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await onSaveConsent({
        notificationConsentState: key === 'notificationConsentState' ? value as PrivacySummary['notificationConsentState'] : summary.notificationConsentState,
        crmConsentState: key === 'crmConsentState' ? value as PrivacySummary['crmConsentState'] : summary.crmConsentState,
        analyticsConsentState: key === 'analyticsConsentState' ? value as PrivacySummary['analyticsConsentState'] : summary.analyticsConsentState,
      })
      setMessage(t('member.privacySaved', { defaultValue: 'プライバシー設定を更新しました。' }))
      trackMizzzEvent('consent_settings_save', { key, value })
    } catch {
      setError(t('member.privacySaveError', { defaultValue: '設定の保存に失敗しました。時間をおいて再試行してください。' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded border border-gray-200 p-4 dark:border-gray-700 lg:col-span-2">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('member.privacyCenterTitle', { defaultValue: 'Privacy Center / データと同意管理' })}</h2>
      <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">{t('member.privacyCenterLead', { defaultValue: '通知許諾・CRM配信・解析同意、データ取得、解約/削除申請をここで自己管理できます。' })}</p>

      <div className="mt-3 grid gap-2 md:grid-cols-3 text-xs">
        <label className="rounded border border-gray-200 p-2 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">通知同意</span>
          <select className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900" value={summary.notificationConsentState} onChange={(e) => void save('notificationConsentState', e.target.value)} disabled={saving}>
            <option value="enabled">enabled</option>
            <option value="partial">partial</option>
            <option value="disabled">disabled</option>
          </select>
        </label>
        <label className="rounded border border-gray-200 p-2 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">CRM同意</span>
          <select className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900" value={summary.crmConsentState} onChange={(e) => void save('crmConsentState', e.target.value)} disabled={saving}>
            <option value="opted_in">opted_in</option>
            <option value="opted_out">opted_out</option>
            <option value="restricted">restricted</option>
          </select>
        </label>
        <label className="rounded border border-gray-200 p-2 dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">解析同意</span>
          <select className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-900" value={summary.analyticsConsentState} onChange={(e) => void save('analyticsConsentState', e.target.value)} disabled={saving}>
            <option value="unknown">unknown</option>
            <option value="accepted">accepted</option>
            <option value="declined">declined</option>
            <option value="limited">limited</option>
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2 text-xs">
        <div className="rounded bg-gray-50 p-3 dark:bg-gray-900/40">
          <p>dataExportState: <span className="font-mono">{summary.dataExportState}</span></p>
          <p>deletionState: <span className="font-mono">{summary.deletionState}</span></p>
          <p>retentionState: <span className="font-mono">{summary.retentionState}</span></p>
          <p>membershipCancellationState: <span className="font-mono">{summary.membershipCancellationState}</span></p>
        </div>
        <div className="rounded border border-dashed border-gray-300 p-3 dark:border-gray-700">
          <p>{summary.userFacingNotes?.export}</p>
          <p className="mt-1">{summary.userFacingNotes?.deletion}</p>
          <p className="mt-1">{summary.userFacingNotes?.retention}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <button type="button" onClick={() => void onRequestExport()} className="rounded bg-indigo-600 px-3 py-1.5 font-semibold text-white">{t('member.privacyExportAction', { defaultValue: 'データエクスポートを申請' })}</button>
        <button type="button" onClick={() => void onRequestCancellation()} className="rounded border border-amber-400 px-3 py-1.5 text-amber-700 dark:text-amber-300">{t('member.privacyCancelMembershipAction', { defaultValue: '会員解約を申請' })}</button>
        <button type="button" onClick={() => void onRequestDeletion()} className="rounded border border-rose-400 px-3 py-1.5 text-rose-700 dark:text-rose-300">{t('member.privacyDeletionAction', { defaultValue: 'アカウント削除を申請' })}</button>
      </div>

      <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">{t('member.privacySupportLead', { defaultValue: '削除・保持・法務対応が関わる場合はサポート運用へエスカレーションされます。' })}</p>
      <Link to={ROUTES.SUPPORT_CENTER} className="mt-1 inline-flex text-xs underline text-violet-600 dark:text-violet-300">{t('member.privacySupportLink', { defaultValue: 'サポートに相談する' })}</Link>

      {message && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">{message}</p>}
      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{error}</p>}
    </section>
  )
}
