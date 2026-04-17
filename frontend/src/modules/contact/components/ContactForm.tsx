import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useContactForm } from '@/modules/contact/hooks/useContactForm'
import { MAX_FILES, validateFile } from '@/modules/contact/lib/submit'
import { ROUTES } from '@/lib/routeConstants'
import TerminalField from './TerminalField'

type Step = 'input' | 'confirm'

function ResultScreen({ success, submittedId, onRetry, onReset }: { success: boolean; submittedId: number | null; onRetry: () => void; onReset: () => void }) {
  const { t } = useTranslation()
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="py-10 space-y-5">
      <div className={`p-6 border ${success ? 'border-emerald-800/40 bg-emerald-950/30' : 'border-red-800/40 bg-red-950/20'}`}>
        <p className="font-mono text-sm text-gray-200">{success ? t('contact.successTitle') : t('contact.resultFailedTitle')}</p>
        <p className="mt-2 text-sm text-gray-400">{success ? t('contact.successMessage') : t('contact.errorMessage')}</p>
        {success ? <p className="mt-2 text-xs text-gray-500">#{submittedId ?? '-'} / {new Date().toLocaleString()}</p> : null}
      </div>
      <div className="flex gap-4 text-xs font-mono">
        {success
          ? <button type="button" onClick={onReset} className="text-gray-500 hover:text-gray-300">{t('contact.sendAnother')}</button>
          : <button type="button" onClick={onRetry} className="text-gray-500 hover:text-gray-300">{t('contact.retry')}</button>}
        <Link to={ROUTES.CONTACT} className="text-gray-500 hover:text-gray-300">{t('contact.backToContactTop')}</Link>
      </div>
    </motion.div>
  )
}

export default function ContactForm() {
  const { t } = useTranslation()
  const { fields, errors, status, submittedId, handleChange, validate, submit, clearStatus, reset } = useContactForm()
  const [step, setStep] = useState<Step>('input')
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setStep('confirm')
  }

  async function handleSend() {
    if (submitting) return
    setSubmitting(true)
    await submit(files)
    setSubmitting(false)
  }

  function handleReset() {
    setFiles([])
    setFileError(null)
    setStep('input')
    reset()
  }

  if (status === 'success') {
    return <ResultScreen success submittedId={submittedId} onRetry={() => setStep('input')} onReset={handleReset} />
  }
  if (status === 'error') {
    return <ResultScreen success={false} submittedId={submittedId} onRetry={() => { clearStatus(); setStep('confirm') }} onReset={handleReset} />
  }

  if (step === 'confirm') {
    return (
      <div className="space-y-5 text-sm">
        <p className="font-mono text-xs text-cyan-400">{t('contact.confirmTitle')}</p>
        <dl className="space-y-2 text-gray-300">
          <div><dt className="text-gray-500">{t('contact.name')}</dt><dd>{fields.name}</dd></div>
          <div><dt className="text-gray-500">{t('contact.email')}</dt><dd>{fields.email}</dd></div>
          <div><dt className="text-gray-500">{t('contact.subject')}</dt><dd>{fields.subject}</dd></div>
          <div><dt className="text-gray-500">{t('contact.message')}</dt><dd className="whitespace-pre-wrap">{fields.message}</dd></div>
          <div><dt className="text-gray-500">{t('contact.attachFile')}</dt><dd>{files.length > 0 ? files.map((file) => file.name).join(', ') : '-'}</dd></div>
        </dl>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setStep('input')} className="font-mono text-xs text-gray-500 hover:text-gray-300">{t('contact.backToEdit')}</button>
          <button type="button" onClick={handleSend} disabled={submitting || status === 'submitting'} className="border border-emerald-700 px-4 py-2 font-mono text-xs text-emerald-400 disabled:opacity-50">{status === 'submitting' ? t('contact.submitting') : t('contact.sendConfirmed')}</button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleConfirm} noValidate className="space-y-6">
      <div className="hidden"><input name="honeypot" value={fields.honeypot} onChange={handleChange} tabIndex={-1} autoComplete="off" /></div>
      <TerminalField id="contact-name" name="name" label={t('contact.name')} required value={fields.name} onChange={handleChange} error={errors.name} />
      <TerminalField id="contact-email" name="email" type="email" label={t('contact.email')} required value={fields.email} onChange={handleChange} error={errors.email} />
      <TerminalField id="contact-subject" name="subject" label={t('contact.subject')} required value={fields.subject} onChange={handleChange} error={errors.subject} />
      <TerminalField id="contact-message" name="message" label={t('contact.message')} multiline rows={6} required value={fields.message} onChange={handleChange} error={errors.message} />
      <div className="space-y-2">
        <label htmlFor="contact-file" className="font-mono text-[11px] text-gray-400">{t('contact.attachFile')} <span className="text-gray-600">({t('contact.maxFiles', { max: MAX_FILES })})</span></label>
        <input ref={fileRef} id="contact-file" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp" onChange={handleFile} className="block w-full text-xs text-gray-400" />
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
