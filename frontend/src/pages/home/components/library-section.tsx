import { useCallback, useEffect } from 'react'

import useEmblaCarousel from 'embla-carousel-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import { legalFields } from '@/_mocks/data-stack.mock'

export const LibrarySection = () => {
  const { t } = useTranslation('home')
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    dragFree: true
  })

  const autoplay = useCallback(() => {
    if (!emblaApi) return
    emblaApi.scrollNext()
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const interval = setInterval(autoplay, 2000)
    return () => clearInterval(interval)
  }, [emblaApi, autoplay])

  return (
    <section id='library' className='py-12 sm:py-16 md:py-20 bg-white dark:bg-gray-800 overflow-hidden'>
      <div className='container'>
        <div className='text-start mb-8 sm:mb-12 md:mb-16'>
          <h2 className='text-h3 sm:text-h2 font-semibold text-primary dark:text-white mb-2 sm:mb-4'>
            {t('home.library.title')}
          </h2>
          <p className='text-p text-gray-600 dark:text-gray-300 max-w-3xl'>
            {t('home.library.description')}
          </p>
        </div>

        <div className='relative px-1'>
          <div className='overflow-hidden' ref={emblaRef}>
            <div className='flex -mx-3'>
              {legalFields.map((field, index) => (
                <motion.div
                  key={field.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className='flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-[100%] sm:min-w-[50%] lg:min-w-[33.333%] px-3'
                >
                  <div className='bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 h-[220px] flex flex-col justify-between hover:shadow-md transition-all duration-300 group'>
                    <div>
                      <div className='w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center mb-4 shadow-sm border border-gray-100/50 dark:border-gray-700/50 transition-transform duration-300 group-hover:scale-105'>
                        <field.icon className={`w-6 h-6 ${field.color}`} />
                      </div>
                      <h3 className='text-h5 font-bold text-gray-900 dark:text-white mb-2'>
                        {t(`home.library.${field.key}.title`)}
                      </h3>
                      <p className='text-blockquote text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed'>
                        {t(`home.library.${field.key}.description`)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
