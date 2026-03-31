export function isRequired(value: string): boolean {
  return value.trim().length > 0
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isMinLength(value: string, min: number): boolean {
  return value.trim().length >= min
}
