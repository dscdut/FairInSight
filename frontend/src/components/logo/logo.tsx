import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import { logo } from '@/assets/images'
import { ROUTE } from '@/core/constants/path'

const Logo = ({ className = '' }) => {
  return (
    <Link to={ROUTE.HOME}>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`flex items-center space-x-2 ${className}`}
      >
        <div className='relative'>
          <img src={logo} alt='Logo' className='w-10 h-9' />
        </div>
        <span className='text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary'>
          FairInsights
        </span>
      </motion.div>
    </Link> 
  )
}

export default Logo
