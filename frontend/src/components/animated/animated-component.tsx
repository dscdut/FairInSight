import { type ReactNode } from 'react'

import { motion } from 'framer-motion'

/**
 * 1. Background Particles Animation Component
 */
export const HeroBackgroundParticles = () => {
  return (
    <div className='absolute inset-0 overflow-hidden pointer-events-none'>
      {[...Array(20)].map((_, i) => {
        // Safe check for window width/height to avoid SSR issues
        const width = typeof window !== 'undefined' ? window.innerWidth : 1000
        const height = typeof window !== 'undefined' ? window.innerHeight : 800

        return (
          <motion.div
            key={i}
            className='absolute w-2 h-2 bg-blue-500/20 dark:bg-blue-400/20 rounded-full'
            initial={{
              x: Math.random() * width,
              y: Math.random() * height,
              scale: Math.random() * 2 + 1
            }}
            animate={{
              y: [null, Math.random() * height],
              x: [null, Math.random() * width]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        )
      })}
    </div>
  )
}

/**
 * 2. Generic Fade Up Component
 */
interface FadeUpProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
}

export const FadeUp = ({ children, className = '', delay = 0, duration = 0.5 }: FadeUpProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * 3. Mouse Scroll Indicator Animation Component
 */
export const ScrollIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className='absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none'
    >
      <motion.div
        animate={{
          y: [0, 10, 0]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className='w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex justify-center'
      >
        <motion.div
          animate={{
            y: [0, 10, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className='w-1 h-2 bg-gray-400 dark:bg-gray-600 rounded-full mt-2'
        />
      </motion.div>
    </motion.div>
  )
}