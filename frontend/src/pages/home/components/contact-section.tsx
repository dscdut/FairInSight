import { motion } from 'framer-motion'
import { MapPin, Mail, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export const ContactSection = () => {
  const { t } = useTranslation('home')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <section id='contacts' className='py-20 bg-background-secondary overflow-hidden relative'>
      {/* Background Decorative glow elements */}
      <div className='absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full filter blur-[100px] pointer-events-none' />

      <div className='container relative z-10'>
        {/* Top Split Layout: Have a question/feedback left + Form Card right */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center'>
          
          {/* Left Block */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className='flex flex-col text-start items-start'
          >
            <span className='text-xs font-bold uppercase tracking-widest text-primary mb-3 block'>
              {t('home.contacts.title') || 'GET IN TOUCH'}
            </span>
            <h2 className='text-h3 sm:text-h2 md:text-[2.75rem] font-bold text-main mb-6 leading-tight'>
              {t('home.contacts.heading') || 'Have a question or feedback?'}
            </h2>
            <p className='text-p text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-lg'>
              {t('home.contacts.description') || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.'}
            </p>
            <div className='w-14 h-1 bg-primary rounded-full' />
          </motion.div>

          {/* Right Block: Form Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className='bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 sm:p-10 shadow-2xl'
          >
            <form onSubmit={handleSubmit} className='grid grid-cols-1 sm:grid-cols-2 gap-5 text-start'>
              {/* Name */}
              <Input
                label={t('home.contacts.nameLabel') || 'Name'}
                required
                placeholder={t('home.contacts.nameLabel') || 'Name'}
                containerClassName='sm:col-span-1'
                className='border-border-secondary hover:border-border-secondary focus-visible:border-primary'
              />

              {/* Company */}
              <Input
                label={t('home.contacts.companyLabel') || 'Company'}
                placeholder={t('home.contacts.companyLabel') || 'Company'}
                containerClassName='sm:col-span-1'
              />

              {/* Email */}
              <Input
                type='email'
                label={t('home.contacts.emailLabel') || 'Email'}
                required
                placeholder={t('home.contacts.emailLabel') || 'Email'}
                containerClassName='sm:col-span-1'
                className='border-border-secondary hover:border-border-secondary focus-visible:border-primary'
              />

              {/* Phone */}
              <Input
                type='tel'
                label={t('home.contacts.phoneLabel') || 'Phone'}
                placeholder={t('home.contacts.phoneLabel') || 'Phone'}
                containerClassName='sm:col-span-1'
              />

              {/* Subject */}
              <Input
                label={t('home.contacts.subjectLabel') || 'Subject'}
                required
                placeholder={t('home.contacts.subjectLabel') || 'Subject'}
                containerClassName='sm:col-span-2'
                className='border-border-secondary hover:border-border-secondary focus-visible:border-primary'
              />

              {/* Message */}
              <div className='sm:col-span-2 space-y-2'>
                <label className='text-sm font-medium text-black'>
                  {t('home.contacts.messageLabel') || 'Message'}
                </label>
                <Textarea
                  placeholder={t('home.contacts.messageLabel') || 'Message'}
                  rows={4}
                  className='min-h-[100px] resize-none rounded-[18px] bg-background border-[var(--border-secondary)] text-[var(--text-primary)] hover:border-border-secondary focus-visible:ring-ring focus-visible:ring-offset-2'
                />
              </div>

              {/* Submit */}
              <div className='sm:col-span-2 mt-2'>
                <Button
                  type='submit'
                  className='w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all text-sm'
                >
                  {t('home.contacts.submitBtn') || 'Submit'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Bottom Section Layout: Map on left, Location details on right */}
        <div className='grid grid-cols-1 lg:grid-cols-2 mt-24 rounded-[24px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl'>
          
          {/* Map Frame */}
          <div className='w-full min-h-[380px] h-full relative bg-slate-100 dark:bg-slate-950'>
            <iframe
              src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.123533857502!2d106.65362547585501!3d10.801841280628314!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529292e1030d1%3A0xf10c3d9641d11971!2sC%E1%BB%99ng%20H%C3%B2a%2C%20T%C3%A2n%20B%C3%ACnh%2C%20Th%C3%A0nh%20ph%E1%BB%91%20H%E1%BB%93%20Ch%C3%AD%20Minh!5e0!3m2!1sen!2svn!4v1718800000000!5m2!1sen!2svn'
              className='w-full h-full min-h-[380px] border-0 dark:opacity-80'
              allowFullScreen={false}
              loading='lazy'
              title='Office Location Map'
            />
          </div>

          {/* Location details card - Mint Green tint box */}
          <div className='bg-background-primaryLight p-8 sm:p-12 md:p-14 flex flex-col justify-center text-start items-start relative'>
            <span className='text-xs font-bold uppercase tracking-widest text-primary mb-3 block'>
              {t('home.contacts.locationTitle') || 'LOCATION'}
            </span>
            <h2 className='text-h3 sm:text-h2 font-bold text-slate-900 dark:text-white mb-4 leading-tight'>
              {t('home.contacts.locationHeading') || "We're here to help."}
            </h2>
            <p className='text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-sm'>
              {t('home.contacts.locationDesc') || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}
            </p>

            <div className='w-full flex flex-col gap-5'>
              {/* Address */}
              <div className='flex items-start gap-4'>
                <div className='w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0 border border-slate-100 dark:border-slate-700/50'>
                  <MapPin className='w-5 h-5 text-primary' />
                </div>
                <div className='flex flex-col text-start'>
                  <span className='text-xs text-black font-semibold uppercase tracking-wider mb-0.5'>Address</span>
                  <p className='text-sm text-slate-900 dark:text-slate-100 font-medium'>
                    {t('home.contacts.address') || 'Jln Cempaka Wangi No 22, Jakarta - Indonesia'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className='flex items-start gap-4'>
                <div className='w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0 border border-slate-100 dark:border-slate-700/50'>
                  <Mail className='w-5 h-5 text-primary' />
                </div>
                <div className='flex flex-col text-start'>
                  <span className='text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5'>Email</span>
                  <a href={`mailto:${t('home.contacts.email')}`} className='text-sm text-slate-900 dark:text-slate-100 hover:text-primary hover:underline font-semibold transition-colors'>
                    {t('home.contacts.email') || 'support@yourdomain.tld'}
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className='flex items-start gap-4'>
                <div className='w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0 border border-slate-100 dark:border-slate-700/50'>
                  <Phone className='w-5 h-5 text-primary' />
                </div>
                <div className='flex flex-col text-start'>
                  <span className='text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5'>Phone</span>
                  <p className='text-sm text-slate-900 dark:text-slate-100 font-semibold'>
                    {t('home.contacts.phone') || '+(62)21 2002-2012'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  )
}
