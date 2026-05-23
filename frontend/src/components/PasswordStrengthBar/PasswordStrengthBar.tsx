import { useTranslation } from 'react-i18next'

type Props = {
  password: string
}

const getPasswordStrength = (password: string) => {
  let score = 0
  if (password.length >= 5) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  return score
}

export default function PasswordStrengthBar({ password }: Props) {
  const { t } = useTranslation('auth')

  const strength = getPasswordStrength(password || '')

  const getLabel = () => {
    if (!password) return t('password.empty')
    if (strength < 2) return t('password.weak')
    if (strength < 3) return t('password.medium')
    return t('password.strong')
  }

  const getColor = () => {
    if (!password) return 'bg-background-tertiary'
    if (strength < 2) return 'bg-error-primary'
    if (strength < 3) return 'bg-warning-primary'
    return 'bg-success-primary'
  }

  return (
    <div className='mt-2'>
      <div className='flex gap-1'>
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-0.5 flex-1 rounded ${i < strength ? getColor() : 'bg-background-tertiary'}`} />
        ))}
      </div>

      <div className='text-[10px] font-semibold text-red-700 text-right mt-1'>{getLabel()}</div>
    </div>
  )
}
