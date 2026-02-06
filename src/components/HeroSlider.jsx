import React, { useEffect, useRef, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation, Parallax } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import { useI18n } from '../i18n'

export default function HeroSlider({ onViewMenu, onOrderClick }){
  const { t } = useI18n()
  const swiperRef = useRef(null)
  const [parallaxEnabled, setParallaxEnabled] = useState(true)

  useEffect(() => {
    const updateParallax = () => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const isMobile = window.matchMedia('(max-width: 768px)').matches
      setParallaxEnabled(!prefersReduced && !isMobile)
    }
    updateParallax()
    window.addEventListener('resize', updateParallax)
    return () => window.removeEventListener('resize', updateParallax)
  }, [])

  const slides = [
    { src: '/RAF POPCORN.jpg' },
    { src: '/RAF CHOCOLATE.jpg' },
    { src: '/RAF APPLE PIE.jpg' }
  ]

  return (
    <section className="hero-slider">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, Parallax]}
        loop
        speed={850}
        parallax={parallaxEnabled}
        pagination={{ clickable: true }}
        navigation
        autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        onSwiper={(swiper) => { swiperRef.current = swiper }}
        onTouchStart={() => swiperRef.current?.autoplay?.stop()}
        onTouchEnd={() => swiperRef.current?.autoplay?.start()}
        onMouseEnter={() => swiperRef.current?.autoplay?.stop()}
        onMouseLeave={() => swiperRef.current?.autoplay?.start()}
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={idx}>
            <div className="hero-slide">
              <div className="hero-slide-media">
                <img src={slide.src} alt={t('hero.rafTitle')} loading="lazy" decoding="async" />
              </div>
              <div className="hero-slide-overlay" />
              <div className="hero-slide-glass" />
              <div className="hero-slide-content" data-swiper-parallax={parallaxEnabled ? '-120' : undefined}>
                <h1 data-swiper-parallax={parallaxEnabled ? '-160' : undefined}>{t('hero.rafTitle')}</h1>
                <p data-swiper-parallax={parallaxEnabled ? '-120' : undefined}>{t('hero.rafSubtitle')}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
