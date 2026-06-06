import Header from '@/components/header-nav/header-nav'
import { AboutSection } from '@/pages/home/components/about-section'
import { AISection } from '@/pages/home/components/ai-section'
import { ContactSection } from '@/pages/home/components/contact-section'
import { FooterSection } from '@/pages/home/components/footer-section'
import { HeroSection } from '@/pages/home/components/hero-section'
import { LibrarySection } from '@/pages/home/components/library-section'

const HomePage = () => {
  return (
    <div className='min-h-screen bg-white dark:bg-gray-900'>
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <LibrarySection />
        <AISection />
        <ContactSection />
      </main>

      <FooterSection />
    </div>
  )
}

export default HomePage
