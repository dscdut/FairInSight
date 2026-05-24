import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { hero_img } from '@/assets/images'
import {
  HeroBackgroundParticles,
  FadeUp,
  ScrollIndicator
} from '@/components/animated/animated-component'
import { Button } from '@/components/ui/button'

export const HeroSection = () => {
  const navigate = useNavigate()
  const { t } = useTranslation('home')

  return (
    <section id='dashboard' className='relative min-h-screen flex items-center justify-center overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900' />

      <HeroBackgroundParticles />

      <div className='container grid grid-cols-1 md:grid-cols-2 items-center gap-12 relative z-10'>
        <div className='flex justify-center md:justify-start'>
          <FadeUp className='text-start'>
            <h1 className='text-h1 sm:text-h1 md:text-h1 font-semibold mb-6 text-black dark:text-white'>
              <span className='text-primary'>{t('home.hero.logo')}</span>
              {t('home.hero.title')}
            </h1>
            <p className='text-p sm:text-p md:text-p text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto'>
              {t('home.hero.description')}
            </p>
            <div className='flex flex-col sm:flex-row items-start justify-start gap-4'>
              <Button
                variant='default'
                size='lg'
                onClick={() => navigate('/login')}
              >
                {t('home.hero.getStarted')}
              </Button>
              <Button
                onClick={() => window.open('#', '_blank')}
                variant='secondary'
                size='lg'
              >
                {t('home.hero.searchLaw')}
              </Button>
            </div>
          </FadeUp>
        </div>
        <div className='flex justify-center md:justify-end'>
          <FadeUp>
            <img src={hero_img} alt='hero section image' className='max-w-full h-auto' />
          </FadeUp>
        </div>
      </div>

      <ScrollIndicator />
    </section>
  )
}
