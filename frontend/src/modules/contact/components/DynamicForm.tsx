import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/lib/routeConstants'
import TerminalField from './TerminalField'
import TerminalSelect from './TerminalSelect'
import type { FormDefinition } from '@/modules/contact/lib/formDefinitions'
import { DEFAULT_ALLOWED_TYPES, InquirySubmitError, MAX_FILE_BYTES, MAX_FILES, submitGenericForm, validateFile, type InquiryDeliveryState, type InquiryResultState, type InquirySubmitState, type InquirySubmissionResult } from '@/modules/contact/lib/submit'

type Step = 'input' | 'confirm'

function pickLocale(localized: Record<string, string>, locale: string): string {
  const normalized = locale.split('-')[0]
  return localized[normalized] ?? localized.ja ?? Object.values(localized)[0] ?? ''
}

export default function DynamicForm({ definition, sourcePage }: { definition: FormDefinition; sourcePage: string }) {
  const { i18n, t } = useTranslation()
  const orderedFields = useMemo(() => [...definition.fields].sort((a, b) => a.order - b.order), [definition.fields])
  const initialValues = useMemo<Record<string, string | boolean>>(() => {
    const next: Record<string, string | boolean> = { honeypot: '' }
    for (const field of orderedFields) next[field.name] = field.fieldType === 'checkbox' || field.fieldType === 'consent' ? false : ''
    return next
  }, [orderedFields])

  const [values, setValues] = useState<Record<string, string | boolean>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('input')
  const [submitState, setSubmitState] = useState<InquirySubmitState>('idle')
  const [resultState, setResultState] = useState<InquiryResultState>('none')
  const [deliveryState, setDeliveryState] = useState<InquiryDeliveryState>('not_sent')
  const [submissionResult, setSubmissionResult] = useState<InquirySubmissionResult | null>(null)
  const [submittedId, setSubmittedId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)

  const maxFiles = definition.maxFiles || MAX_FILES
  const allowedTypes = definition.allowedMimeTypes?.length ? definition.allowedMimeTypes : DEFAULT_ALLOWED_TYPES
  const maxFileBytes = definition.maxFileSize || MAX_FILE_BYTES

  function handleFieldChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function validate(): boolean {
    const next: Record<string, string> = {}
    for (const field of orderedFields) {
      const raw = values[field.name]
      const str = typeof raw === 'string' ? raw.trim() : ''
      const checked = raw === true
      if (field.required) {
        if ((field.fieldType === 'consent' || field.fieldType === 'checkbox') && !checked) next[field.name] = t('contact.errors.policyRequired')
        if (!(field.fieldType === 'consent' || field.fieldType === 'checkbox') && !str) next[field.name] = t('contact.errors.required')
      }
      if (field.validationRule === 'email' && str && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) next[field.name] = t('contact.errors.emailFormat')
      if (field.validationRule === 'min10' && str.length < 10) next[field.name] = t('contact.errors.minLength', { min: 10 })
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFileError(null)
    const next = [...files]
    for (const file of selected) {
      const err = validateFile(file, allowedTypes, maxFileBytes)
      if (err) {
        setFileError(t(`contact.errors.${err}`))
        return
      }
      if (next.length >= maxFiles) {
        setFileError(t('contact.errors.fileCount', { max: maxFiles }))
        return
      }
      next.push(file)
    }
    setFiles(next)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function onSubmit() {
    if (submitState === 'submitting') return
    setSubmitState('confirmed')
    setResultState('none')
    setErrorMessage('')
    setSubmitState('submitting')
    try {
      const mapped: Record<string, string | boolean> = {}
      for (const field of orderedFields) {
        if (field.name === 'policyAgree') continue
        mapped[field.name] = values[field.name]
      }
      const result = await submitGenericForm({
        formType: definition.formType,
        inquiryCategory: definition.defaultCategory,
        locale: i18n.language,
        sourcePage,
        honeypot: String(values.honeypot ?? ''),
        policyAgree: Boolean(values.policyAgree),
        fields: mapped,
        files,
        maxFiles,
      })
      setSubmittedId(result.id)
      setSubmissionResult(result)
      setDeliveryState(result.inquiryDeliveryState)
      setResultState(result.inquiryResultState)
      setSubmitState('succeeded')
    } catch (error) {
      const fallback = t('contact.errorMessage')
      if (error instanceof InquirySubmitError) {
        setResultState(error.resultState)
        setErrorMessage(error.message || fallback)
      } else if (error instanceof Error) {
        setResultState('system_error')
        setErrorMessage(error.message || fallback)
      } else {
        setResultState('system_error')
        setErrorMessage(fallback)
      }
      setDeliveryState('failed')
      setSubmitState('failed')
    }
  }

  function resetAll() {
    setValues(initialValues)
    setErrors({})
    setStep('input')
    setSubmitState('idle')
    setResultState('none')
    setDeliveryState('not_sent')
    setSubmittedId(null)
    setSubmissionResult(null)
    setErrorMessage('')
    setFiles([])
    setFileError(null)
  }

  if (submitState === 'succeeded' || submitState === 'failed') {
    const success = submitState === 'succeeded'
    const suggestedSupportLinks = definition.sourceSite === 'store'
      ? [
          { to: ROUTES.SUPPORT_CENTER, label: t('support.toSupportCenter') },
          { to: '/guide', label: t('support.quickLinks.storeGuide') },
          { to: '/faq', label: t('support.toFaq') },
        ]
      : definition.sourceSite === 'fc'
        ? [
            { to: ROUTES.SUPPORT_CENTER, label: t('support.toSupportCenter') },
            { to: '/guide', label: t('support.quickLinks.fcGuide') },
            { to: '/faq', label: t('support.toFaq') },
          ]
        : [
            { to: ROUTES.SUPPORT_CENTER, label: t('support.toSupportCenter') },
            { to: ROUTES.FAQ, label: t('support.toFaq') },
          ]

    return (
      <div className="py-8 space-y-4">
        <p className={`font-mono text-sm ${success ? 'text-emerald-400' : 'text-red-400'}`}>
          {success ? pickLocale(definition.successMessage, i18n.language) : pickLocale(definition.failureMessage, i18n.language)}
        </p>
        {success ? <p className="text-xs text-gray-500">#{submittedId ?? '-'} / {submissionResult?.inquiryReceivedAt ? new Date(submissionResult.inquiryReceivedAt).toLocaleString() : new Date().toLocaleString()}</p> : null}
        {success ? <p className="text-xs text-gray-500">traceId: {submissionResult?.inquiryTraceId ?? submissionResult?.requestId ?? '-'}</p> : null}
        {success ? <p className="text-xs text-gray-500">delivery: {deliveryState}</p> : null}
        {success ? <p className="text-xs text-gray-500">result: {resultState}</p> : null}
        {!success ? <p className="text-xs text-gray-500">result: {resultState}</p> : null}
        {!success && errorMessage ? <p className="text-xs text-red-300 whitespace-pre-wrap">{errorMessage}</p> : null}
        <div className="rounded-xl border border-cyan-800/50 bg-cyan-950/20 p-4">
          <p className="text-xs text-cyan-300">{t('support.postSubmitHelpTitle')}</p>
          <p className="mt-1 text-xs text-gray-400">{t('support.postSubmitHelpDescription')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedSupportLinks.map((link) => (
              <Link key={`${definition.formType}-${link.to}`} to={link.to} className="rounded-full border border-cyan-700/60 px-3 py-1 text-xs text-cyan-200 hover:border-cyan-400">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex gap-3 text-xs font-mono">
          {success ? <button type="button" onClick={resetAll} className="text-gray-500 hover:text-gray-300">{t('contact.sendAnother')}</button> : <button type="button" onClick={() => { setSubmitState('idle'); setResultState('none'); setStep('confirm') }} className="text-gray-500 hover:text-gray-300">{t('contact.retry')}</button>}
          <Link to={ROUTES.CONTACT} className="text-gray-500 hover:text-gray-300">{t('contact.backToContactTop')}</Link>
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="space-y-5 text-sm">
        <p className="font-mono text-xs text-cyan-400">{t('contact.confirmTitle')}</p>
        <dl className="space-y-2 text-gray-300">
          {orderedFields.filter((field) => field.fieldType !== 'hidden').map((field) => (
            <div key={`confirm-${field.name}`}>
              <dt className="text-gray-500">{pickLocale(field.label, i18n.language)}</dt>
              <dd className="whitespace-pre-wrap">{field.fieldType === 'consent' ? (values[field.name] ? '✓' : '-') : String(values[field.name] ?? '-')}</dd>
            </div>
          ))}
          {definition.attachmentEnabled ? <div><dt className="text-gray-500">{t('contact.attachFile')}</dt><dd>{files.length > 0 ? files.map((file) => file.name).join(', ') : '-'}</dd></div> : null}
        </dl>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setStep('input')} className="font-mono text-xs text-gray-500 hover:text-gray-300">{t('contact.backToEdit')}</button>
          <button type="button" onClick={onSubmit} disabled={submitState === 'submitting'} className="border border-emerald-700 px-4 py-2 font-mono text-xs text-emerald-400 disabled:opacity-50">{submitState === 'submitting' ? t('contact.submitting') : t('contact.sendConfirmed')}</button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); setSubmitState('validating'); if (validate()) { setSubmitState('ready_to_confirm'); setStep('confirm') } else { setSubmitState('idle') } }} noValidate className="space-y-6">
      <div className="hidden"><input name="honeypot" value={String(values.honeypot ?? '')} onChange={handleFieldChange} tabIndex={-1} autoComplete="off" /></div>
      {orderedFields.map((field) => {
        if (field.fieldType === 'hidden' || field.name === 'honeypot') return null
        if (field.fieldType === 'select' || field.fieldType === 'radio') {
          return (
            <TerminalSelect
              key={field.name}
              id={`${definition.formType}-${field.name}`}
              name={field.name}
              label={pickLocale(field.label, i18n.language)}
              required={field.required}
              optional={!field.required}
              value={String(values[field.name] ?? '')}
              onChange={handleFieldChange}
              options={(field.options ?? []).map((opt) => ({ value: opt.value, label: pickLocale(opt.label, i18n.language) }))}
              error={errors[field.name]}
            />
          )
        }
        if (field.fieldType === 'checkbox' || field.fieldType === 'consent') {
          return (
            <div key={field.name}>
              <label className="flex items-start gap-2 text-xs text-gray-500">
                <input type="checkbox" name={field.name} checked={Boolean(values[field.name])} onChange={handleFieldChange} className="mt-0.5" />
                <span>{pickLocale(field.label, i18n.language)} {field.fieldType === 'consent' ? <><Link to={ROUTES.LEGAL_PRIVACY} className="mx-1 underline">{t('footer.privacy')}</Link>/<Link to={ROUTES.LEGAL_TERMS} className="mx-1 underline">{t('footer.terms')}</Link></> : null}</span>
              </label>
              {errors[field.name] ? <p className="text-xs text-red-400">{errors[field.name]}</p> : null}
            </div>
          )
        }
        return (
          <TerminalField
            key={field.name}
            id={`${definition.formType}-${field.name}`}
            name={field.name}
            type={field.fieldType === 'textarea' ? 'text' : field.fieldType}
            multiline={field.fieldType === 'textarea'}
            rows={6}
            label={pickLocale(field.label, i18n.language)}
            required={field.required}
            optional={!field.required}
            value={String(values[field.name] ?? '')}
            onChange={handleFieldChange}
            error={errors[field.name]}
            placeholder={field.placeholder ? pickLocale(field.placeholder, i18n.language) : undefined}
          />
        )
      })}

      {definition.attachmentEnabled ? (
        <div className="space-y-2">
          <label htmlFor={`${definition.formType}-file`} className="font-mono text-[11px] text-gray-400">{t('contact.attachFile')} <span className="text-gray-600">({t('contact.maxFiles', { max: maxFiles })})</span></label>
          <input ref={fileRef} id={`${definition.formType}-file`} type="file" multiple onChange={onFileChange} className="block w-full text-xs text-gray-400" />
          {files.length > 0 && <ul className="text-xs text-gray-500 space-y-1">{files.map((file, index) => <li key={`${file.name}-${index}`} className="flex justify-between"><span>{file.name}</span><button type="button" onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))} className="text-red-400">{t('contact.removeFile')}</button></li>)}</ul>}
          {fileError ? <p className="text-xs text-red-400">{fileError}</p> : null}
        </div>
      ) : null}

      <button type="submit" className="group flex items-center gap-2 border border-emerald-700 hover:border-emerald-500 hover:bg-emerald-950/40 px-6 py-2.5 font-mono text-sm text-emerald-400">{t('contact.toConfirm')}</button>
    </form>
  )
}
