interface Props {
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
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void
}

export default function FormField({
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
}: Props) {
  const inputClass = `w-full border px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-500 ${
    error ? 'border-red-300' : 'border-gray-200'
  }`

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="flex items-baseline gap-2 text-sm text-gray-700">
        {label}
        {required && (
          <span className="text-xs text-gray-400">必須</span>
        )}
        {optional && (
          <span className="text-xs text-gray-400">任意</span>
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
          className={`${inputClass} resize-none`}
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
          className={inputClass}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      )}

      {error && (
        <p id={`${id}-error`} className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
