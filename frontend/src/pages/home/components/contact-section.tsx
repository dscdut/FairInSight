import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

export const ContactSection = () => {
  const { t } = useTranslation('home')

  return (
    <section id='contacts' className='py-20 bg-background-primary dark:bg-gray-900 overflow-hidden relative'>
      {/* Background Decorative Sparkle elements */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none' />

      <div className='container relative z-10'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-white dark:from-primary/20 dark:via-primary/5 dark:to-gray-900/50 border border-primary/10 dark:border-primary/5 p-8 sm:p-12 md:p-16 text-center shadow-lg hover:shadow-xl transition-all duration-300'
        >
          {/* Top Badge */}
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background-primaryLight dark:bg-background-primaryLight/20 text-primary text-sm font-semibold border border-primary/20 mb-6'>
            <Sparkles className='w-4 h-4' />
            <span>{t('home.contacts.title')}</span>
          </div>

          {/* Heading */}
          <h2 className='text-h3 sm:text-h2 font-semibold text-black dark:text-white mb-6 leading-tight max-w-3xl mx-auto'>
            {t('home.contacts.ctaTitle')}
          </h2>

          {/* Description */}
          <p className='text-p text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed'>
            {t('home.contacts.ctaDesc')}
          </p>

          {/* Button Call to Action */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className='inline-block'>
            <Button
              size='lg'
              className='px-8 py-6 text-btn-large rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 group'
            >
              <span>{t('home.contacts.ctaBtn')}</span>
              <ArrowRight className='w-5 h-5 transition-transform duration-300 group-hover:translate-x-1' />
            </Button>
          </motion.div>

          {/* Abstract geometric mesh decorations in card corners */}
          <div className='absolute -top-12 -left-12 w-24 h-24 rounded-full border border-primary dark:border-primary pointer-events-none bg-primary' />
          <div className='absolute -bottom-12 -right-12 w-32 h-32 rounded-full border border-primary dark:border-primary pointer-events-none bg-primary' />
        </motion.div>
      </div>
    </section>
  )
}
