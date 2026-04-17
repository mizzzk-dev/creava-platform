import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRequestForm } from '@/modules/contact/hooks/useRequestForm'
import { MAX_FILES, validateFile } from '@/modules/contact/lib/submit'
import { ROUTES } from '@/lib/routeConstants'
import TerminalField from './TerminalField'
import TerminalSelect from './TerminalSelect'

type Step = 'input' | 'confirm'

export default function RequestForm() {
  const { t } = useTranslation()
  const { fields, errors, status, submittedId, handleChange, validate, submit, clearStatus, reset } = useRequestForm()
  const [step, setStep] = useState<Step>('input')
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const requestTypeOptions = [
    { value: 'video', label: t('contact.requestTypes.video') },
    { value: 'photo', label: t('contact.requestTypes.photo') },
    { value: 'music', label: t('contact.requestTypes.music') },
    { value: 'web', label: t('contact.requestTypes.web') },
    { value: 'other', label: t('contact.requestTypes.other') },
  ]

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFileError(null)
    const next = [...files]
    for (const file of selected) {
      const err = validateFile(file)
      if (err) {
        setFileError(t(`contact.errors.${err}`))
        return
      }
      if (next.length >= MAX_FILES) {
        setFileError(t('contact.errors.fileCount', { max: MAX_FILES }))
        return
      }
      next.push(file)
    }
    setFiles(next)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setStep('confirm')
  }

  async function onSend() {
    await submit(files)
  }

  if (status === 'success') {
    return (
      <div className="space-y-4 py-10">
        <p className="font-mono text-sm text-emerald-400">{t('contact.successTitle')}</p>
        <p className="text-sm text-gray-400">{t('contact.successMessage')}</p>
        <p className="text-xs text-gray-500">#{submittedId ?? '-'} / {new Date().toLocaleString()}</p>
        <div className="flex gap-3 text-xs font-mono">
          <button type="button" onClick={() => { reset(); setFiles([]); setStep('input') }} className="text-gray-500 hover:text-gray-300">{t('contact.sendAnother')}</button>
          <Link to={ROUTES.PRICING} className="text-gray-500 hover:text-gray-300">{t('pricing.title')}</Link>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-4 py-10">
        <p className="font-mono text-sm text-red-400">{t('contact.resultFailedTitle')}</p>
        <p className="text-sm text-gray-400">{t('contact.errorMessage')}</p>
        <div className="flex gap-3 text-xs font-mono">
          <button type="button" onClick={() => { clearStatus(); setStep('confirm') }} className="text-gray-500 hover:text-gray-300">{t('contact.retry')}</button>
          <button type="button" onClick={() => setStep('input')} className="text-gray-500 hover:text-gray-300">{t('contact.backToEdit')}</button>
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="space-y-5 text-sm">
        <p className="font-mono text-xs text-cyan-400">{t('contact.confirmTitle')}</p>
        <dl className="space-y-2 text-gray-300">
          <div><dt className="text-gray-500">{t('contact.name')}</dt><dd>{fields.name}</dd></div>
          <div><dt className="text-gray-500">{t('contact.email')}</dt><dd>{fields.email}</dd></div>
          <div><dt className="text-gray-500">{t('contact.company')}</dt><dd>{fields.company || '-'}</dd></div>
          <div><dt className="text-gray-500">{t('contact.requestType')}</dt><dd>{requestTypeOptions.find((opt) => opt.value === fields.requestType)?.label ?? '-'}</dd></div>
          <div><dt className="text-gray-500">{t('contact.detail')}</dt><dd className="whitespace-pre-wrap">{fields.detail}</dd></div>
          <div><dt className="text-gray-500">{t('contact.attachFile')}</dt><dd>{files.length > 0 ? files.map((file) => file.name).join(', ') : '-'}</dd></div>
        </dl>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setStep('input')} className="font-mono text-xs text-gray-500 hover:text-gray-300">{t('contact.backToEdit')}</button>
          <button type="button" onClick={onSend} disabled={status === 'submitting'} className="border border-emerald-700 px-4 py-2 font-mono text-xs text-emerald-400 disabled:opacity-50">{status === 'submitting' ? t('contact.submitting') : t('contact.sendConfirmed')}</button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onConfirm} noValidate className="space-y-6">
      <div className="hidden"><input name="honeypot" value={fields.honeypot} onChange={handleChange} tabIndex={-1} autoComplete="off" /></div>
      <TerminalField id="req-name" name="name" label={t('contact.name')} required value={fields.name} onChange={handleChange} error={errors.name} />
      <TerminalField id="req-email" name="email" type="email" label={t('contact.email')} required value={fields.email} onChange={handleChange} error={errors.email} />
      <TerminalField id="req-company" name="company" label={t('contact.company')} optional value={fields.company} onChange={handleChange} error={errors.company} />
      <TerminalSelect id="req-type" name="requestType" label={t('contact.requestType')} required placeholder={t('contact.selectRequestType')} value={fields.requestType} onChange={handleChange} options={requestTypeOptions} error={errors.requestType} />
      <TerminalField id="req-budget" name="budget" label={t('contact.budget')} optional value={fields.budget} onChange={handleChange} error={errors.budget} />
      <TerminalField id="req-deadline" name="deadline" label={t('contact.deadline')} optional value={fields.deadline} onChange={handleChange} error={errors.deadline} />
      <TerminalField id="req-detail" name="detail" label={t('contact.detail')} multiline rows={6} required value={fields.detail} onChange={handleChange} error={errors.detail} />
      <div className="space-y-2">
        <label htmlFor="req-file" className="font-mono text-[11px] text-gray-400">{t('contact.attachFile')} <span className="text-gray-600">({t('contact.maxFiles', { max: MAX_FILES })})</span></label>
        <input ref={fileRef} id="req-file" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp" onChange={handleFile} className="block w-full text-xs text-gray-400" />
        {files.length > 0 && <ul className="text-xs text-gray-500 space-y-1">{files.map((file, index) => <li key={`${file.name}-${index}`} className="flex justify-between"><span>{file.name}</span><button type="button" onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))} className="text-red-400">{t('contact.removeFile')}</button></li>)}</ul>}
        {fileError ? <p className="text-xs text-red-400">{fileError}</p> : null}
      </div>
      <label className="flex items-start gap-2 text-xs text-gray-500">
        <input type="checkbox" name="policyAgree" checked={fields.policyAgree} onChange={handleChange} className="mt-0.5" />
        <span>{t('contact.policyAgreePrefix')}<Link to={ROUTES.LEGAL_PRIVACY} className="mx-1 underline">{t('footer.privacy')}</Link>{t('contact.policyAgreeAnd')}<Link to={ROUTES.LEGAL_TERMS} className="mx-1 underline">{t('footer.terms')}</Link>{t('contact.policyAgreeSuffix')}</span>
      </label>
      {errors.policyAgree ? <p className="text-xs text-red-400">{errors.policyAgree}</p> : null}
      <button type="submit" className="group flex items-center gap-2 border border-emerald-700 hover:border-emerald-500 hover:bg-emerald-950/40 px-6 py-2.5 font-mono text-sm text-emerald-400">{t('contact.toConfirm')}</button>
    </form>
  )
}
