import { motion } from 'framer-motion'
import { Contact, FileText, FileSearch, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const features = [
  {
    icon: Contact,
    key: 'reputable'
  },
  {
    icon: FileText,
    key: 'fast'
  },
  {
    icon: FileSearch,
    key: 'affordable'
  },
  {
    icon: Send,
    key: 'easyConnect'
  }
]

export const AboutSection = () => {
  const { t } = useTranslation('home')

  return (
    <section id='about' className='py-20 bg-background-primary'>
      <div className='container'>
        <div className='text-center mb-16'>
          <h2 className='text-h3 sm:text-h2 font-bold text-main mb-4'>
            {t('home.features.title')}
          </h2>
          <p className='text-p text-text-secondary max-w-3xl mx-auto'>
            {t('home.features.description')}
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 lg:gap-y-0 justify-center'>
          {features.map((feature, index) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className='relative flex flex-col items-center text-center px-6 lg:border-r border-border-secondary last:border-r-0'
            >
              {/* Icon Container - Solid Primary Color with Very Rounded Corners */}
              <div className='w-16 h-16 bg-primary rounded-[22px] flex items-center justify-center mb-6 shadow-sm hover:scale-105 transition-transform duration-300'>
                <feature.icon className='w-7 h-7 text-white' />
              </div>

              {/* Feature Title */}
              <h3 className='text-lg font-bold text-main mb-3'>
                {t('home.features.' + feature.key + '.title')}
              </h3>

              {/* Feature Description */}
              <p className='text-sm text-text-secondary leading-relaxed max-w-[240px]'>
                {t('home.features.' + feature.key + '.description')}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
