import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroSlider from '../components/HeroSlider'
import MenuSection from '../components/MenuSection'
import Cart from '../components/Cart'
import OrderButton from '../components/OrderButton'
import LoyaltyCard from '../components/LoyaltyCard'
import Footer from '../components/Footer'
import { useI18n } from '../i18n'
import menuData from '../data/menu.json'
import { useModal } from '../components/ModalProvider'

export default function Home(){
  const { t } = useI18n()
  const { showAlert } = useModal()
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [user, setUser] = useState(null)
  const [userCard, setUserCard] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user')||'null')
    setUser(u)
    if(u) {
      setUserCard(u.loyaltyCard)
      const syncCard = async () => {
        try {
          const res = await fetch(`/api/users/${u.phone}/loyalty`)
          const card = await res.json()
          setUserCard(card)
          const updated = { ...u, loyaltyCard: card }
          localStorage.setItem('user', JSON.stringify(updated))
          setUser(updated)
          window.dispatchEvent(new Event('user-updated'))
        } catch (e) {
          console.error(e)
        }
      }
      syncCard()
    }
  }, [])

  const onAdd = (item) => {
    setCart(prev=>[...prev, item])
  }

  const onRemove = (idx) => setCart(prev=>prev.filter((_,i)=>i!==idx))

  const handleViewMenu = () => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleOrderClick = () => {
    if(cart.length === 0) showAlert(t('cart.enterPhone'))
  }

  return (
    <div>
      <HeroSlider />

      <section className="hero-cta">
        <div className="container hero-cta-inner">
          <button className="btn-primary" onClick={handleViewMenu}>
            {t('hero.viewMenu')}
          </button>
          <button className="btn-secondary" onClick={handleOrderClick}>
            {t('hero.orderNow')}
          </button>
        </div>
      </section>
      
      <div className="menu-container" ref={containerRef}>
        <div className="container">
          {menuData.sections.map(sec => (
            <MenuSection 
              key={sec.id} 
              section={sec} 
              onAdd={onAdd}
              userCard={userCard}
            />
          ))}

          {cart.length > 0 && (
            <Cart 
              items={cart} 
              onRemove={onRemove}
              discount={userCard?.status === 'active' ? userCard.discount_percent : 0}
            />
          )}
        </div>
      </div>

      <OrderButton 
        items={cart} 
        user={user}
        userCard={userCard}
        onPlaced={()=>{setCart([]);}} 
      />

      {user && (
        <section className="loyalty-section">
          <div className="container">
            <h2 className="section-title">{t('profile.loyaltyCard')}</h2>
            <LoyaltyCard card={userCard} user={user} />
            {!userCard && (
              <p className="loyalty-hint">{t('profile.cardInactive')}</p>
            )}
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
