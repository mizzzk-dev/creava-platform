interface Option {
  value: string
  label: string
}

interface Props {
  id: string
  name: string
  label: string
  required?: boolean
  error?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: Option[]
  placeholder?: string
}

export default function FormSelect({
  id,
  name,
  label,
  required,
  error,
  value,
  onChange,
  options,
  placeholder,
}: Props) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="flex items-baseline gap-2 text-sm text-gray-700">
        {label}
        {required && <span className="text-xs text-gray-400">必須</span>}
      </label>

      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full border px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500 ${
          error ? 'border-red-300' : 'border-gray-200'
        }`}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <p id={`${id}-error`} className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
