import { useTranslation } from 'react-i18next'

interface TerminalFieldProps {
  id: string
  name: string
  label: string
  type?: string
  multiline?: boolean
  rows?: number
  required?: boolean
  optional?: boolean
  error?: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export default function TerminalField({
  id,
  name,
  label,
  type = 'text',
  multiline = false,
  rows = 5,
  required,
  optional,
  error,
  placeholder,
  value,
  onChange,
}: TerminalFieldProps) {
  const { t } = useTranslation()

  const baseInput = `w-full bg-transparent border-b ${
    error
      ? 'border-red-500/60 focus:border-red-400'
      : 'border-gray-700 focus:border-emerald-500'
  } px-0 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors font-mono caret-emerald-400`

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-baseline gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500">
          {label}
        </span>
        {required && (
          <span className="font-mono text-[9px] text-gray-600">{t('form.required')}</span>
        )}
        {optional && (
          <span className="font-mono text-[9px] text-gray-700">{t('form.optional')}</span>
        )}
      </label>

      {multiline ? (
        <textarea
          id={id}
          name={name}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${baseInput} resize-none leading-relaxed`}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={baseInput}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      )}

      {error && (
        <p id={`${id}-error`} className="font-mono text-[11px] text-red-400" role="alert">
          ! {error}
        </p>
      )}
    </div>
  )
}
