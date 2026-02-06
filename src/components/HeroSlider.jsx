import React, { useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

export default function HeroSlider(){
  const swiperRef = useRef(null)

  const slides = [
    { src: '/RAF POPCORN.jpg' },
    { src: '/RAF CHOCOLATE.jpg' },
    { src: '/RAF APPLE PIE.jpg' }
  ]

  return (
    <section className="hero-slider">
      <Swiper
        modules={[Autoplay, Pagination]}
        loop
        speed={850}
        pagination={{ clickable: true }}
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
                <img src={slide.src} alt="Coffee Land" loading="lazy" decoding="async" />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
