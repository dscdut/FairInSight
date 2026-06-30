import { useState } from 'react'

import { Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { navLinks } from '@/_mocks/data-nav-bar.mock'
import { LanguageSwitcher } from '@/components/language/language-switcher'
import Logo from '@/components/logo/logo'
import { ThemeToggle } from '@/components/theme/theme-toogle'
import { Button } from '@/components/ui/button'
import { ROUTE } from '@/core/constants/path'

import { FloatAnimate } from '../animated/float'

const handleSmoothScroll = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, to: string) => {
  e.preventDefault()
  const el = document.querySelector(to)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

const Header = () => {
  const { t } = useTranslation('home')
  const { t: tAuth } = useTranslation('auth')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className='relative w-full bg-transparent'>
      <FloatAnimate direct='down' speed={2.9} className='absolute top-1 left-0 z-50 container flex justify-between items-center py-3 mx-auto'>
        <Logo />
        <ul className='hidden gap-6 items-center lg:flex'>
          {navLinks.map((link) => (
            <li key={link.to}>
              <button
                onClick={(e) => handleSmoothScroll(e, link.to)}
                className='px-2 py-1 text-p-medium text-white bg-transparent rounded border-none transition-colors cursor-pointer hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              >
                {t(`home.${link.labelKey}`)}
              </button>
            </li>
          ))}
        </ul>

        <div className='flex gap-4 items-center'>
          <ThemeToggle />
          <LanguageSwitcher />
          <div className='hidden gap-2 items-center md:flex'>
              <Button variant='outline' asChild>
                <Link to={ROUTE.AUTH.LOGIN}>{tAuth('login')}</Link>
              </Button>
              <Button asChild>
                <Link to={ROUTE.AUTH.REGISTER}>{tAuth('register')}</Link>
              </Button>
            </div>

          {/* Mobile menu button */}
          <button
            className='flex justify-center items-center p-2 rounded md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X className='w-7 h-7 text-text-primary' aria-hidden='true' />
            ) : (
              <Menu className='w-7 h-7 text-text-primary' aria-hidden='true' />
            )}
          </button>
        </div>
      </FloatAnimate>

      {/* Mobile nav menu */}
      {menuOpen && (
        <div className='absolute left-0 top-full w-full bg-background-primary border-b border-border-primary shadow-lg md:hidden animate-fade-in'>
          <ul className='flex flex-col gap-2 p-4'>
            {navLinks.map((link) => (
              <li key={link.to}>
                <button
                  onClick={(e) => {
                    handleSmoothScroll(e, link.to)
                    setMenuOpen(false)
                  }}
                  className='px-2 py-2 w-full text-p-medium text-left text-text-secondary bg-transparent rounded border-none transition-colors cursor-pointer hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                >
                  {t(`home.${link.labelKey}`)}
                </button>
              </li>
            ))}
            <div className='flex flex-col gap-2'>
              <Button
                variant='outline'
                asChild
                className='px-4 py-2 text-btn-medium rounded-md border border-border-secondary bg-background-primary/80 text-text-primary hover:bg-background-secondary focus-visible:ring-2 focus-visible:ring-primary'
              >
                <Link to={ROUTE.AUTH.LOGIN} onClick={() => setMenuOpen(false)}>
                  {tAuth('login')}
                </Link>
              </Button>
              <Button
                asChild
                className='px-4 py-2 text-btn-medium rounded-md text-white bg-primary hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary'
              >
                <Link to={ROUTE.AUTH.REGISTER} onClick={() => setMenuOpen(false)}>
                  {tAuth('register')}
                </Link>
              </Button>
            </div>
          </ul>
        </div>
      )}
      <style>{`html { scroll-behavior: smooth; }`}</style>
    </header>
  )
}

export default Header
