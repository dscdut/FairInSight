import { useState } from 'react'

import { motion } from 'framer-motion'
import { MessageSquare, FileCheck, Zap, Bot, User, Send, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

export const AISection = () => {
  const { t } = useTranslation('home')
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showAIResponse, setShowAIResponse] = useState(true)

  const featuresList = [
    {
      key: 'nlp',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      key: 'citation',
      icon: FileCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      key: 'speed',
      icon: Zap,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20'
    }
  ]

  const handleMockSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    setIsTyping(true)
    setShowAIResponse(false)
    setInputValue('')

    setTimeout(() => {
      setIsTyping(false)
      setShowAIResponse(true)
    }, 1500)
  }

  return (
    <section id='ai-assistance' className='py-20 bg-background-tertiary dark:bg-gray-900/30 relative overflow-hidden'>
      <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 dark:bg-primary/5 rounded-full filter blur-[100px] pointer-events-none' />
      <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full filter blur-[100px] pointer-events-none' />

      <div className='container relative z-10'>
        <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background-primaryLight dark:bg-background-primaryLight text-primary text-sm font-medium border border-primary/20  '>
          <Sparkles className='w-4 h-4' />
          <span>{t('home.AI_assistance.title')}</span>
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-12 items-center'>
          <div className='lg:col-span-6 space-y-8'>
            <div className='space-y-4'>
              <h2 className='text-h3 sm:text-h2 text-main dark:text-white leading-tight'>
                {t('home.AI_assistance.sectionTitle')}
              </h2>
              <p className='text-p text-gray-600 dark:text-gray-300 max-w-xl'>{t('home.AI_assistance.description')}</p>
            </div>

            <div className='space-y-4'>
              {featuresList.map((feat, index) => (
                <motion.div
                  key={feat.key}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className='flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-800/50 shadow-sm border border-gray-100 dark:border-gray-800'
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${feat.bgColor}`}>
                    <feat.icon className={`w-5 h-5 ${feat.color}`} />
                  </div>
                  <div>
                    <h4 className='font-bold text-main dark:text-white'>
                      {t(`home.AI_assistance.features.${feat.key}.title`)}
                    </h4>
                    <p className='text-md text-gray-600 dark:text-gray-400 mt-1'>
                      {t(`home.AI_assistance.features.${feat.key}.description`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className='lg:col-span-6'>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-[480px]'
            >
              <div className='px-6 py-4 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3'>
                <div className='w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white'>
                  <Bot className='w-5 h-5' />
                </div>
                <div>
                  <h4 className='font-bold text-sm text-gray-900 dark:text-white'>FairInsights AI</h4>
                  <div className='flex items-center gap-1.5'>
                    <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse' />
                    <span className='text-xs text-gray-500 dark:text-gray-400'>Online</span>
                  </div>
                </div>
              </div>

              {/* Chat Area */}
              <div className='flex-grow p-6 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-gray-900/10'>
                {/* User Message Bubble */}
                <div className='flex items-start gap-3 justify-end'>
                  <div className='bg-primary text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%] shadow-sm text-sm'>
                    {t('home.AI_assistance.chatMock.userQuestion')}
                  </div>
                  <div className='w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0 text-xs font-semibold'>
                    <User className='w-4 h-4' />
                  </div>
                </div>

                {/* AI Typing Indicator */}
                {isTyping && (
                  <div className='flex items-start gap-3'>
                    <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0'>
                      <Bot className='w-4 h-4' />
                    </div>
                    <div className='bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center h-10'>
                      <span
                        className='w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce'
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className='w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce'
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className='w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce'
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                )}

                {showAIResponse && !isTyping && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className='flex items-start gap-3'
                  >
                    <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0'>
                      <Bot className='w-4 h-4' />
                    </div>
                    <div className='bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%] shadow-sm text-sm text-gray-800 dark:text-gray-200 space-y-2 leading-relaxed'>
                      <p>{t('home.AI_assistance.chatMock.aiResponse')}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              <form
                onSubmit={handleMockSubmit}
                className='p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 flex gap-2'
              >
                <input
                  type='text'
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t('home.AI_assistance.chatMock.placeholder')}
                  className='flex-grow px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary dark:text-white'
                />
                <Button type='submit' size='icon' className='rounded-xl shrink-0'>
                  <Send className='w-4 h-4' />
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
