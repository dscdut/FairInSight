import { AboutSection } from '@/pages/home/components/about-section'
import { AISection } from '@/pages/home/components/ai-section'
import { ContactSection } from '@/pages/home/components/contact-section'
import { HeroSection } from '@/pages/home/components/hero-section'
import { LibrarySection } from '@/pages/home/components/library-section'

const HomePage = () => {
  return (
    <div className='min-h-screen bg-background-primary'>
      <main>
        <HeroSection />
        <AISection />
        <LibrarySection />
        <AboutSection />
        <ContactSection />
      </main>
    </div>
  )
}

export default HomePage
