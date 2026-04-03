import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useRequestForm } from '@/modules/contact/hooks/useRequestForm'
import { validateFile } from '@/modules/contact/lib/submit'
import { ROUTES } from '@/lib/routeConstants'
import TerminalField from './TerminalField'
import TerminalSelect from './TerminalSelect'

function SuccessScreen({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="py-10 space-y-6"
    >
      <div className="border border-emerald-800/40 bg-emerald-950/30 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500">
            request received
          </span>
        </div>

        <div className="space-y-2 font-mono text-sm">
          <p className="text-gray-200 font-medium">{t('contact.successTitle')}</p>
          <p className="text-gray-400 text-[13px] leading-relaxed">{t('contact.successMessage')}</p>
          <p className="text-gray-600 text-[12px]">{t('contact.successReply')}</p>
        </div>

        <div className="border-t border-gray-800 pt-4 font-mono text-[11px] text-gray-600">
          {new Date().toLocaleString()}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          onClick={onReset}
          className="font-mono text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          $ new request
        </button>
        <Link
          to={ROUTES.PRICING}
          className="font-mono text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          $ view pricing
        </Link>
        <Link
          to={ROUTES.HOME}
          className="font-mono text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          $ cd ~
        </Link>
      </div>
    </motion.div>
  )
}

export default function RequestForm() {
  const { t } = useTranslation()
  const { fields, errors, status, handleChange, handleSubmit, reset } = useRequestForm()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const requestTypeOptions = [
    { value: 'video', label: t('contact.requestTypes.video') },
    { value: 'photo', label: t('contact.requestTypes.photo') },
    { value: 'music', label: t('contact.requestTypes.music') },
    { value: 'web',   label: t('contact.requestTypes.web')   },
    { value: 'other', label: t('contact.requestTypes.other') },
  ]

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFileError(null)
    if (!f) { setFile(null); return }
    const err = validateFile(f)
    if (err) { setFileError(t(`contact.errors.${err}`)); return }
    setFile(f)
  }

  function handleFormSubmit(e: React.FormEvent) {
    ;(fields as typeof fields & { file?: File }).file = file ?? undefined
    void handleSubmit(e)
  }

  function handleReset() {
    setFile(null)
    setFileError(null)
    if (fileRef.current) fileRef.current.value = ''
    reset()
  }

  if (status === 'success') {
    return <SuccessScreen onReset={handleReset} />
  }

  return (
    <form onSubmit={handleFormSubmit} noValidate className="space-y-6">
      <div className="flex items-center gap-2 font-mono text-[11px] text-gray-600 border-b border-gray-800 pb-3">
        <span className="text-emerald-600">$</span>
        <span>creava --request</span>
      </div>

      {status === 'error' && (
        <p className="font-mono text-[12px] text-red-400">
          ! {t('contact.errorMessage')}
        </p>
      )}

      <TerminalField
        id="req-name"
        name="name"
        label={t('contact.name')}
        required
        value={fields.name}
        onChange={handleChange}
        error={errors.name}
      />
      <TerminalField
        id="req-email"
        name="email"
        type="email"
        label={t('contact.email')}
        required
        value={fields.email}
        onChange={handleChange}
        error={errors.email}
      />
      <TerminalField
        id="req-company"
        name="company"
        label={t('contact.company')}
        optional
        value={fields.company}
        onChange={handleChange}
        error={errors.company}
      />
      <TerminalSelect
        id="req-type"
        name="requestType"
        label={t('contact.requestType')}
        required
        placeholder={t('contact.selectRequestType')}
        value={fields.requestType}
        onChange={handleChange}
        options={requestTypeOptions}
        error={errors.requestType}
      />
      <TerminalField
        id="req-budget"
        name="budget"
        label={t('contact.budget')}
        optional
        value={fields.budget}
        onChange={handleChange}
        error={errors.budget}
      />
      <TerminalField
        id="req-deadline"
        name="deadline"
        label={t('contact.deadline')}
        optional
        value={fields.deadline}
        onChange={handleChange}
        error={errors.deadline}
      />
      <TerminalField
        id="req-detail"
        name="detail"
        label={t('contact.detail')}
        multiline
        rows={6}
        required
        value={fields.detail}
        onChange={handleChange}
        error={errors.detail}
      />

      {/* file attachment */}
      <div className="space-y-1.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500">
          {t('contact.attachFile')}
          <span className="ml-2 text-gray-700 normal-case tracking-normal">{t('contact.attachFileSub')}</span>
        </span>
        <div className="flex items-center gap-3">
          <label
            htmlFor="req-file"
            className="cursor-pointer font-mono text-[11px] border border-gray-700 hover:border-gray-500 px-3 py-1.5 text-gray-400 hover:text-gray-200 transition-colors"
          >
            {file ? file.name : '+ attach'}
          </label>
          {file && (
            <button
              type="button"
              onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = '' }}
              className="font-mono text-[11px] text-gray-600 hover:text-red-400 transition-colors"
              aria-label={t('contact.removeFile')}
            >
              ✕
            </button>
          )}
          <input
            ref={fileRef}
            id="req-file"
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.zip"
            onChange={handleFile}
            className="sr-only"
          />
        </div>
        {fileError && (
          <p className="font-mono text-[11px] text-red-400">! {fileError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="group flex items-center gap-2 border border-emerald-700 hover:border-emerald-500 hover:bg-emerald-950/40 px-6 py-2.5 font-mono text-sm text-emerald-400 transition-all disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="text-emerald-700 group-hover:text-emerald-500">$</span>
        {status === 'submitting' ? t('contact.submitting') : `${t('contact.submit')} ↵`}
      </button>
    </form>
  )
}
