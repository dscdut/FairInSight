import { useCallback, useEffect } from 'react'

import useEmblaCarousel from 'embla-carousel-react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { legalFields } from '@/_mocks/data-stack.mock'

const fieldMeta: Record<string, { badge: string; image: string }> = {
  civil: {
    badge: 'LITIGATION',
    image: 'https://plus.unsplash.com/premium_photo-1663054511601-814ad30cb8aa?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  housing: {
    badge: 'REAL ESTATE',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80'
  },
  business: {
    badge: 'CORPORATE',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80'
  },
  marriage: {
    badge: 'FAMILY',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=400&q=80'
  },
  criminal: {
    badge: 'DEFENSE',
    image: 'https://images.unsplash.com/photo-1605806616949-1e87b487fc2f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  labor: {
    badge: 'LABOR',
    image: 'https://images.unsplash.com/photo-1495725274072-fd5d0b961a9f?q=80&w=1443&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  },
  admin: {
    badge: 'ADMINISTRATIVE',
    image: 'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?auto=format&fit=crop&w=400&q=80'
  }
}

export const LibrarySection = () => {
  const { t } = useTranslation('home')
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    dragFree: true
  })

  // Reorder fields to match the mockup: business (Corporate), civil (Litigation), criminal (Defense), marriage (Family), followed by the rest
  const orderedFields = [
    ...legalFields.filter((f) => f.key === 'business'),
    ...legalFields.filter((f) => f.key === 'civil'),
    ...legalFields.filter((f) => f.key === 'criminal'),
    ...legalFields.filter((f) => f.key === 'marriage'),
    ...legalFields.filter((f) => !['business', 'civil', 'criminal', 'marriage'].includes(f.key))
  ]

  const autoplay = useCallback(() => {
    if (!emblaApi) return
    emblaApi.scrollNext()
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const interval = setInterval(autoplay, 4000) // Lower autoplay frequency for manual interaction
    return () => clearInterval(interval)
  }, [emblaApi, autoplay])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  return (
    <section id='library' className='py-16 sm:py-20 md:py-24 relative overflow-hidden bg-slate-950'>
      {/* Background with subtle lawyer picture overlay and cyan glow */}
      <div className='absolute inset-0 overflow-hidden'>
        <img
          src='https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1200&q=80'
          alt=''
          className='w-full h-full object-cover opacity-10 pointer-events-none'
          aria-hidden='true'
        />
        <div className='absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950' />
        <div className='absolute bottom-0 left-1/3 -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none' />
      </div>

      <div className='container relative z-10'>
        {/* Header Block */}
        <div className='grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-12 sm:mb-16'>
          <div className='md:col-span-7 text-start'>
            <div className='inline-flex items-center px-3.5 py-1.5 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] mb-4 bg-white/5'>
              {t('home.library.badge') || 'My Services'}
            </div>
            <h2 className='text-[3rem] md:text-[3rem] font-semibold text-white leading-[1.2]'>
              {t('home.library.trusted') || 'Trusted'} <br />
              <span className='text-primary'>{t('home.library.expertise') || 'Expertise'}</span>
            </h2>
          </div>
          <div className='md:col-span-5 flex flex-col md:items-end gap-6 text-start md:text-right'>
            <p className='text-p text-white/60 max-w-sm'>
              {t('home.library.trustedDesc') || 'I deliver trusted legal services with proven experience and a results-driven focus.'}
            </p>
            <div className='flex items-center gap-3'>
              <button
                onClick={scrollPrev}
                className='w-11 h-11 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 flex items-center justify-center text-white/80 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                aria-label='Previous slide'
              >
                <ChevronLeft className='w-5 h-5' />
              </button>
              <button
                onClick={scrollNext}
                className='w-11 h-11 rounded-full bg-white text-slate-950 flex items-center justify-center hover:bg-white/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-md'
                aria-label='Next slide'
              >
                <ChevronRight className='w-5 h-5' />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Block */}
        <div className='relative px-1'>
          <div className='overflow-hidden cursor-grab active:cursor-grabbing' ref={emblaRef}>
            <div className='flex -mx-4'>
              {orderedFields.map((field, index) => {
                const meta = fieldMeta[field.key] || { badge: 'GENERAL', image: '' }
                const isDarkCard = field.key === 'civil'

                return (
                  <motion.div
                    key={field.key}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className='flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_33.333%] lg:flex-[0_0_25%] min-w-[100%] sm:min-w-[50%] md:min-w-[33.333%] lg:min-w-[25%] px-4'
                  >
                    <div
                      className={`relative flex flex-col justify-between rounded-[24px] p-6 h-[380px] transition-all duration-300 group overflow-hidden border ${
                        isDarkCard
                          ? 'bg-slate-900/95 border-slate-800 text-white shadow-200'
                          : 'bg-white border-slate-100 text-slate-900 shadow-100 hover:shadow-200'
                      }`}
                    >
                      <div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full border text-[10px] font-bold mb-3 uppercase tracking-widest ${
                            isDarkCard
                              ? 'border-white/10 text-white/80 bg-white/5'
                              : 'border-slate-200 text-slate-600 bg-slate-50'
                          }`}
                        >
                          {meta.badge}
                        </span>
                        <h3 className={`text-h5 font-bold mb-3 ${isDarkCard ? 'text-white' : 'text-slate-900'}`}>
                          {t(`home.library.${field.key}.title`)}
                        </h3>
                      </div>

                      {meta.image && (
                        <div className='w-full h-[140px] rounded-2xl overflow-hidden mb-2 border border-black/5 dark:border-white/5'>
                          <img
                            src={meta.image}
                            alt={t(`home.library.${field.key}.title`)}
                            className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]'
                          />
                        </div>
                      )}

                      <div className='flex justify-between items-end gap-3 mt-auto'>
                        <p
                          className={`text-sm line-clamp-3 leading-relaxed max-w-[72%] ${
                            isDarkCard ? 'text-white/70' : 'text-slate-500'
                          }`}
                        >
                          {t(`home.library.${field.key}.description`)}
                        </p>
                        <button
                          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 ${
                            isDarkCard
                              ? 'bg-white/10 hover:bg-white/20 text-white'
                              : 'border border-primary text-primary hover:border-primary hover:bg-primary'
                          }`}
                          aria-label={`Learn more about ${t(`home.library.${field.key}.title`)}`}
                        >
                          <ArrowUpRight className='w-5 h-5' />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
