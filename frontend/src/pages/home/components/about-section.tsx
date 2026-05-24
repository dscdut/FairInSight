import { motion } from 'framer-motion'
import { Shield, Zap, Scale, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const features = [
  {
    icon: Shield,
    key: 'reputable'
  },
  {
    icon: Zap,
    key: 'fast'
  },
  {
    icon: Scale,
    key: 'affordable'
  },
  {
    icon: Users,
    key: 'easyConnect'
  }
]

export const AboutSection = () => {
  const { t } = useTranslation('home')

  return (
    <section id='about' className='py-20 bg-gray-50 dark:bg-gray-900'>
      <div className='container'>
        <div className='text-center mb-16'>
          <h2 className='text-h3 sm:text-h2 font-semibold text-primary dark:text-white mb-4'>
            {t('home.features.title')}
          </h2>
          <p className='text-p text-gray-600 dark:text-gray-300 max-w-3xl mx-auto'>{t('home.features.description')}</p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-center'>
          {features.map((feature, index) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow'
            >
              <div className='w-12 h-12 bg-background-primaryLight dark:bg-primary/20 rounded-lg flex items-center justify-center mb-4'>
                <feature.icon className='w-6 h-6 text-primary' />
              </div>
              <h3 className='text-xl font-semibold text-gray-900 dark:text-white mb-2'>
                {t('home.features.' + feature.key + '.title')}
              </h3>
              <p className='text-blockquote text-gray-600 dark:text-gray-300'>{t('home.features.' + feature.key + '.description')}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
