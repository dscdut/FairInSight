export const getPasswordStrength = (password: string) => {
  let score = 0

  if (!password) return 0

  if (password.length >= 6) score += 2
  if (password.length >= 10) score += 2

  if (/[A-Z]/.test(password)) score += 2
  if (/[0-9]/.test(password)) score += 2
  if (/[^A-Za-z0-9]/.test(password)) score += 2

  return score
}

export const getPasswordStrengthLabel = (score: number, password: string) => {
  if (!password) return 'Chưa nhập'
  if (score < 5) return 'Yếu'
  if (score < 8) return 'Trung bình'
  return 'Mạnh'
}

export const getPasswordStrengthColor = (password: string) => {
  if (!password) return ''
  return 'bg-red-500'
}
