import React, { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation, Parallax } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

export default function HeroSlider({ onViewMenu, onOrderClick }){
  const swiperRef = useRef(null)

  const slides = [
    { src: '/RAF POPCORN.jpg', title: 'јвторские RAF напитки', subtitle: 'Popcorn Х Chocolate Х Apple Pie' },
    { src: '/RAF CHOCOLATE.jpg', title: 'јвторские RAF напитки', subtitle: 'Popcorn Х Chocolate Х Apple Pie' },
    { src: '/RAF APPLE PIE.jpg', title: 'јвторские RAF напитки', subtitle: 'Popcorn Х Chocolate Х Apple Pie' }
  ]

  return (
    <section className="hero-slider">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, Parallax]}
        loop
        speed={850}
        parallax
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
                <img src={slide.src} alt={slide.title} loading="lazy" decoding="async" />
              </div>
              <div className="hero-slide-overlay" />
              <div className="hero-slide-glass" />
              <div className="hero-slide-content" data-swiper-parallax="-120">
                <h1 data-swiper-parallax="-160">{slide.title}</h1>
                <p data-swiper-parallax="-120">{slide.subtitle}</p>
                <div className="hero-slide-actions" data-swiper-parallax="-80">
                  <button className="btn-primary" onClick={onViewMenu}>ѕосмотреть меню</button>
                  <button className="btn-secondary" onClick={onOrderClick}>«аказать самовывоз</button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
