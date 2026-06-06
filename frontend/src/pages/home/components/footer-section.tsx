import { Facebook, Linkedin, Twitter, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const currentYear = new Date().getFullYear()

export const FooterSection = () => {
  const { t } = useTranslation('home')

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, to: string) => {
    e.preventDefault()
    const el = document.querySelector(to)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className='bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 transition-colors duration-300'>
      <div className='container py-12 sm:py-16'>
        <div className='grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12'>
          {/* Brand & Description Column */}
          <div className='col-span-1 md:col-span-6 space-y-6'>
            <div className='flex items-center gap-1.5'>
              <span className='text-2xl font-bold text-gray-900 dark:text-white tracking-tight'>
                <span className='text-primary'>FairInsights</span>
              </span>
            </div>

            <p className='text-sm text-gray-600 dark:text-gray-400 max-w-md leading-relaxed'>
              {t('home.footer.description')}
            </p>

            {/* Social Icons */}
            <div className='flex space-x-4'>
              <Link
                to='https://facebook.com'
                target='_blank'
                rel='noopener noreferrer'
                className='w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary transition-all duration-200'
                aria-label='Facebook'
              >
                <Facebook className='w-5 h-5' />
              </Link>
              <Link
                to='https://linkedin.com'
                target='_blank'
                rel='noopener noreferrer'
                className='w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary transition-all duration-200'
                aria-label='LinkedIn'
              >
                <Linkedin className='w-5 h-5' />
              </Link>
              <Link
                to='https://twitter.com'
                target='_blank'
                rel='noopener noreferrer'
                className='w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary transition-all duration-200'
                aria-label='Twitter'
              >
                <Twitter className='w-5 h-5' />
              </Link>
              <Link
                to='mailto:contact@fairinsights.com'
                className='w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 dark:hover:text-primary transition-all duration-200'
                aria-label='Email'
              >
                <Mail className='w-5 h-5' />
              </Link>
            </div>
          </div>

          {/* Navigation Sitemap Column */}
          <div className='col-span-1 md:col-span-3 space-y-4'>
            <h4 className='text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest'>
              {t('home.footer.navigation.title')}
            </h4>
            <ul className='space-y-2.5'>
              <li>
                <a
                  href='#dashboard'
                  onClick={(e) => handleSmoothScroll(e, '#dashboard')}
                  className='text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200'
                >
                  {t('home.footer.navigation.dashboard')}
                </a>
              </li>
              <li>
                <a
                  href='#about'
                  onClick={(e) => handleSmoothScroll(e, '#about')}
                  className='text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200'
                >
                  {t('home.footer.navigation.about')}
                </a>
              </li>
              <li>
                <a
                  href='#library'
                  onClick={(e) => handleSmoothScroll(e, '#library')}
                  className='text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200'
                >
                  {t('home.footer.navigation.library')}
                </a>
              </li>
              <li>
                <a
                  href='#ai-assistance'
                  onClick={(e) => handleSmoothScroll(e, '#ai-assistance')}
                  className='text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200'
                >
                  {t('home.footer.navigation.aiAssistance')}
                </a>
              </li>
              <li>
                <a
                  href='#contacts'
                  onClick={(e) => handleSmoothScroll(e, '#contacts')}
                  className='text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200'
                >
                  {t('home.footer.navigation.contacts')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className='col-span-1 md:col-span-3 space-y-4'>
            <h4 className='text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest'>
              {t('home.footer.legal.title')}
            </h4>
            <ul className='space-y-2.5'>
              <li>
                <Link
                  to='/privacy'
                  className='text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200'
                >
                  {t('home.footer.legal.privacy')}
                </Link>
              </li>
              <li>
                <Link
                  to='/terms'
                  className='text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200'
                >
                  {t('home.footer.legal.terms')}
                </Link>
              </li>
              <li>
                <Link
                  to='/license'
                  className='text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200'
                >
                  {t('home.footer.legal.license')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className='mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4'>
          <p className='text-xs text-gray-500 dark:text-gray-500'>
            {t('home.footer.copyright', { year: currentYear })}
          </p>
          <div className='text-xs text-gray-400 dark:text-gray-600'>Powered by advanced legal AI model</div>
        </div>
      </div>
    </footer>
  )
}
