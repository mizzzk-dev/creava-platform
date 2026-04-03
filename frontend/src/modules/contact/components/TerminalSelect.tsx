import { useTranslation } from 'react-i18next'

interface Option {
  value: string
  label: string
}

interface TerminalSelectProps {
  id: string
  name: string
  label: string
  required?: boolean
  optional?: boolean
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: Option[]
  error?: string
}

export default function TerminalSelect({
  id,
  name,
  label,
  required,
  optional,
  placeholder,
  value,
  onChange,
  options,
  error,
}: TerminalSelectProps) {
  const { t } = useTranslation()

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

      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full bg-transparent border-b ${
          error
            ? 'border-red-500/60 focus:border-red-400'
            : 'border-gray-700 focus:border-emerald-500'
        } px-0 py-2 text-sm text-gray-200 outline-none transition-colors font-mono appearance-none cursor-pointer`}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        {placeholder && (
          <option value="" disabled className="bg-gray-950">
            {placeholder}
          </option>
        )}
        {options.map(({ value: v, label: l }) => (
          <option key={v} value={v} className="bg-gray-950 text-gray-200">
            {l}
          </option>
        ))}
      </select>

      {error && (
        <p id={`${id}-error`} className="font-mono text-[11px] text-red-400" role="alert">
          ! {error}
        </p>
      )}
    </div>
  )
}
