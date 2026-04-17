import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isRequired, isEmail, isMinLength } from '@/modules/contact/lib/validation'
import { submitRequest } from '@/modules/contact/lib/submit'
import type { RequestPayload } from '@/modules/contact/lib/submit'

export type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

type Fields = Omit<RequestPayload, 'files'>

type Errors = Partial<Record<keyof Fields, string>>

export function useRequestForm() {
  const { t, i18n } = useTranslation()
  const [fields, setFields] = useState<Fields>({
    name: '',
    email: '',
    company: '',
    requestType: '',
    budget: '',
    deadline: '',
    detail: '',
    phone: '',
    policyAgree: false,
    honeypot: '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<FormStatus>('idle')
  const [submittedId, setSubmittedId] = useState<number | null>(null)

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value, type } = e.target
    const nextValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFields((prev) => ({ ...prev, [name]: nextValue }))
    if (errors[name as keyof Fields]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  function validate(): boolean {
    const next: Errors = {}
    if (!isRequired(fields.name)) next.name = t('contact.errors.required')
    if (!isRequired(fields.email)) {
      next.email = t('contact.errors.required')
    } else if (!isEmail(fields.email)) {
      next.email = t('contact.errors.emailFormat')
    }
    if (!isRequired(fields.requestType)) {
      next.requestType = t('contact.errors.required')
    }
    if (!isMinLength(fields.detail, 10)) {
      next.detail = t('contact.errors.minLength', { min: 10 })
    }
    if (!fields.policyAgree) {
      next.policyAgree = t('contact.errors.policyRequired')
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit(files: File[]) {
    setStatus('submitting')
    try {
      const result = await submitRequest({
        ...fields,
        files,
        locale: i18n.language,
        sourcePage: '/contact?tab=request',
      })
      setStatus('success')
      setSubmittedId(result.id)
    } catch {
      setStatus('error')
    }
  }

  function clearStatus() {
    if (status !== 'idle') setStatus('idle')
  }

  function reset() {
    setFields({
      name: '',
      email: '',
      company: '',
      requestType: '',
      budget: '',
      deadline: '',
      detail: '',
      phone: '',
      policyAgree: false,
      honeypot: '',
    })
    setErrors({})
    setStatus('idle')
    setSubmittedId(null)
  }

  return { fields, errors, status, submittedId, handleChange, validate, submit, clearStatus, reset }
}
