import { useTranslation } from 'react-i18next'
import { useContactForm } from '@/modules/contact/hooks/useContactForm'
import FormField from '@/components/form/FormField'

export default function ContactForm() {
  const { t } = useTranslation()
  const { fields, errors, status, handleChange, handleSubmit, reset } =
    useContactForm()

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
        id="contact-name"
        name="name"
        label={t('contact.name')}
        required
        value={fields.name}
        onChange={handleChange}
        error={errors.name}
      />
      <FormField
        id="contact-email"
        name="email"
        type="email"
        label={t('contact.email')}
        required
        value={fields.email}
        onChange={handleChange}
        error={errors.email}
      />
      <FormField
        id="contact-subject"
        name="subject"
        label={t('contact.subject')}
        required
        value={fields.subject}
        onChange={handleChange}
        error={errors.subject}
      />
      <FormField
        id="contact-message"
        name="message"
        label={t('contact.message')}
        multiline
        rows={6}
        required
        value={fields.message}
        onChange={handleChange}
        error={errors.message}
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
