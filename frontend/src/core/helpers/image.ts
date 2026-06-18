export const getOptimizedImageUrl = (url?: string | null, size = 160): string => {
  if (!url) return ''

  if (url.includes('googleusercontent.com')) {
    const cleanedUrl = url.split('=')[0]
    return `${cleanedUrl}=s${size}-rw` // -rw forces WebP compression
  }

  if (url.includes('api.dicebear.com')) {
    const hasParams = url.includes('?')
    return `${url}${hasParams ? '&' : '?'}size=${size}`
  }

  return url
}
