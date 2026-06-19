import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {  hero_bg } from '@/assets/images'
import { FloatAnimate } from '@/components/animated/float'
import { Button } from '@/components/ui/button'

export const HeroSection = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('home')

  return (
    <section id='dashboard' className='relative min-h-screen flex items-center justify-center overflow-hidden'>
      <div className='absolute inset-0 overflow-hidden'>
        <img
          src={hero_bg}
          alt=''
          className='w-full h-full object-cover dark:opacity-[0.07] pointer-events-none animate-hero-zoom'
          aria-hidden='true'
        />
        {/* <div className='absolute inset-0 bg-gradient-to-t from-background-secondary via-transparent to-transparent' /> */}
      </div>

      <div className='container grid grid-cols-1 md:grid-cols-2 items-center gap-12 relative z-10'>
        <div className='flex justify-center md:justify-start'>
          <FloatAnimate className='text-start' speed={2.5}>
            <h1 className='text-[48px] md:text-[3rem] mb-6 text-white dark:text-white leading-[1.2] font-semibold'>
              <span className='text-primary'>{t('home.hero.logo')}</span>
              {t('home.hero.title')}
            </h1>
            <p className='text-p text-white mb-8 max-w-3xl'>
              {t('home.hero.description')}
            </p>
            <div className='flex flex-col sm:flex-row items-start justify-start gap-4'>
              <Button variant='default' size='lg' onClick={() => navigate('/login')}>
                {t('home.hero.getStarted')}
              </Button>
              <Button onClick={() => window.open('#', '_blank')} variant='secondary' size='lg'>
                {t('home.hero.searchLaw')}
              </Button>
            </div>
          </FloatAnimate>
        </div>
        {/* <div className='flex justify-center md:justify-end'>
          <FloatAnimate direct='left' speed={2.5}>
            <img src={hero_img} alt='hero section image ' className='max-w-full h-auto' />
          </FloatAnimate>
        </div> */}
      </div>

      <div className='absolute bottom-8 left-8 lg:left-16 z-20 max-w-xs md:max-w-md hidden sm:block'>
        <FloatAnimate direct='right' speed={2.5} delay={0.5}>
          <p className='text-xs text-white/50 leading-relaxed font-light'>
            {t('home.hero.footerText')}
          </p>
        </FloatAnimate>
      </div>

      <div className='absolute bottom-8 right-8 lg:right-16 z-20 max-w-xs md:max-w-sm hidden text-right sm:flex flex-col items-end'>
        <FloatAnimate direct='left' speed={2.5} delay={0.5} className='flex flex-col items-end'>
          <div className='flex items-center gap-2 mb-2'>
            <div className='flex -space-x-2.5 overflow-hidden p-1'>
              <img
                className='inline-block h-8 w-8 rounded-full ring-2 ring-background-secondary object-cover'
                src='https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'
                alt=''
              />
              <img
                className='inline-block h-8 w-8 rounded-full ring-2 ring-background-secondary object-cover'
                src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'
                alt=''
              />
              <img
                className='inline-block h-8 w-8 rounded-full ring-2 ring-background-secondary object-cover'
                src='https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80'
                alt=''
              />
              <img
                className='inline-block h-8 w-8 rounded-full ring-2 ring-background-secondary object-cover'
                src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80'
                alt=''
              />
            </div>
            <span className='text-sm font-semibold text-white/80'>{t('home.hero.lawyersCount')}</span>
          </div>
          <p className='text-xs text-white/50 leading-relaxed font-light'>
            {t('home.hero.footerTextRight')}
          </p>
        </FloatAnimate>
      </div>

    </section>
  )
}
