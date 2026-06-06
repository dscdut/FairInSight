import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-h1',
        'text-h2',
        'text-h3',
        'text-h4',
        'text-h5',
        'text-p',
        'text-p-medium',
        'text-large',
        'text-small',
        'text-blockquote',
        'text-placeholder',
        'text-btn-giant',
        'text-btn-large',
        'text-btn-medium',
        'text-btn-small',
        'text-btn-tiny'
      ]
    }
  }
})

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}
