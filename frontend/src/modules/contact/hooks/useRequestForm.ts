import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isRequired, isEmail, isMinLength } from '@/modules/contact/lib/validation'
import { submitRequest } from '@/modules/contact/lib/submit'
import type { RequestPayload } from '@/modules/contact/lib/submit'

export type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

type Fields = RequestPayload

type Errors = Partial<Record<keyof Fields, string>>

export function useRequestForm() {
  const { t } = useTranslation()
  const [fields, setFields] = useState<Fields>({
    name: '',
    email: '',
    company: '',
    requestType: '',
    budget: '',
    deadline: '',
    detail: '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<FormStatus>('idle')

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
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
    if (!isRequired(fields.requestType))
      next.requestType = t('contact.errors.required')
    if (!isMinLength(fields.detail, 10)) {
      next.detail = t('contact.errors.minLength', { min: 10 })
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setStatus('submitting')
    try {
      await submitRequest(fields)
      setStatus('success')
    } catch {
      setStatus('error')
    }
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
    })
    setErrors({})
    setStatus('idle')
  }

  return { fields, errors, status, handleChange, handleSubmit, reset }
}
