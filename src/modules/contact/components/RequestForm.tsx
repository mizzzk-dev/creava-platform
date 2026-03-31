import { useTranslation } from 'react-i18next'
import { useRequestForm } from '@/modules/contact/hooks/useRequestForm'
import FormField from '@/components/form/FormField'
import FormSelect from '@/components/form/FormSelect'

export default function RequestForm() {
  const { t } = useTranslation()
  const { fields, errors, status, handleChange, handleSubmit, reset } =
    useRequestForm()

  const requestTypeOptions = [
    { value: 'video', label: t('contact.requestTypes.video') },
    { value: 'photo', label: t('contact.requestTypes.photo') },
    { value: 'music', label: t('contact.requestTypes.music') },
    { value: 'other', label: t('contact.requestTypes.other') },
  ]

  if (status === 'success') {
    return (
      <div className="py-12 text-center">
        <p className="text-base font-medium text-gray-900">
          {t('contact.successTitle')}
        </p>
        <p className="mt-2 text-sm text-gray-500">{t('contact.successMessage')}</p>
        <button
          onClick={reset}
          className="mt-6 text-sm text-gray-400 underline underline-offset-4 transition-colors hover:text-gray-700"
        >
          {t('contact.sendAnother')}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-6">
      {status === 'error' && (
        <p className="text-sm text-red-500">{t('contact.errorMessage')}</p>
      )}

      <FormField
        id="req-name"
        name="name"
        label={t('contact.name')}
        required
        value={fields.name}
        onChange={handleChange}
        error={errors.name}
      />
      <FormField
        id="req-email"
        name="email"
        type="email"
        label={t('contact.email')}
        required
        value={fields.email}
        onChange={handleChange}
        error={errors.email}
      />
      <FormField
        id="req-company"
        name="company"
        label={t('contact.company')}
        optional
        value={fields.company}
        onChange={handleChange}
        error={errors.company}
      />
      <FormSelect
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
      <FormField
        id="req-budget"
        name="budget"
        label={t('contact.budget')}
        optional
        value={fields.budget}
        onChange={handleChange}
        error={errors.budget}
      />
      <FormField
        id="req-deadline"
        name="deadline"
        label={t('contact.deadline')}
        optional
        value={fields.deadline}
        onChange={handleChange}
        error={errors.deadline}
      />
      <FormField
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

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-gray-900 py-3 text-sm font-medium tracking-wide text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'submitting' ? t('contact.submitting') : t('contact.submit')}
      </button>
    </form>
  )
}
