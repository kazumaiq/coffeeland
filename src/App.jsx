import React, { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import AuthModal from './components/AuthModal'
import ModalProvider from './components/ModalProvider'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import Account from './pages/Account'
import Admin from './pages/Admin'

export default function App(){
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const bgRef = useRef(null)

  useEffect(() => {
    const syncUser = () => {
      const u = JSON.parse(localStorage.getItem('user')||'null')
      setUser(u)
    }
    syncUser()
    const onUserUpdated = () => syncUser()
    window.addEventListener('user-updated', onUserUpdated)
    return () => window.removeEventListener('user-updated', onUserUpdated)
  }, [])

  useEffect(() => {
    const root = bgRef.current
    if(!root) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const layers = Array.from(root.querySelectorAll('.coffee-layer'))
    if(layers.length === 0 || prefersReduced || isMobile) return

    let current = window.scrollY || window.pageYOffset || 0
    let target = current
    let rafId = null
    let ease = window.matchMedia('(max-width: 768px)').matches ? 0.05 : 0.08

    const update = () => {
      current += (target - current) * ease
      layers.forEach((layer) => {
        const speed = parseFloat(layer.dataset.speed || '0.2')
        const offset = -(current * speed)
        layer.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`
      })
      if(Math.abs(target - current) > 0.2) {
        rafId = window.requestAnimationFrame(update)
      } else {
        rafId = null
      }
    }

    const onScroll = () => {
      target = window.scrollY || window.pageYOffset || 0
      if(rafId === null) rafId = window.requestAnimationFrame(update)
    }

    const onResize = () => {
      ease = window.matchMedia('(max-width: 768px)').matches ? 0.05 : 0.08
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if(rafId) window.cancelAnimationFrame(rafId)
    }
  }, [])

  const handleAuthClick = () => {
    setAuthModalOpen(true)
  }

  const handleProfileClick = () => {
    if(user) navigate('/account')
    else setAuthModalOpen(true)
  }

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    setAuthModalOpen(false)
    navigate('/')
  }

  return (
    <ModalProvider>
      <div className="app">
        <div className="coffee-bg" aria-hidden="true" ref={bgRef}>
          <div className="coffee-layer coffee-layer--far" data-speed="0.12">
            <span className="coffee-bean coffee-bean--outline bean-1" />
            <span className="coffee-bean coffee-bean--line bean-2 is-mobile-hidden" />
            <span className="coffee-bean coffee-bean--solid bean-3" />
          </div>
          <div className="coffee-layer coffee-layer--mid" data-speed="0.24">
            <span className="coffee-bean coffee-bean--cup bean-4" />
            <span className="coffee-bean coffee-bean--solid bean-5" />
            <span className="coffee-bean coffee-bean--outline bean-6" />
          </div>
          <div className="coffee-layer coffee-layer--near" data-speed="0.42">
            <span className="coffee-bean coffee-bean--solid bean-7" />
            <span className="coffee-bean coffee-bean--line bean-8 is-mobile-hidden" />
            <span className="coffee-bean coffee-bean--cup bean-9 is-mobile-hidden" />
            <span className="coffee-bean coffee-bean--outline bean-10" />
          </div>
          <div className="coffee-overlay" />
        </div>
        <Header 
          user={user}
          onAuthClick={handleAuthClick}
          onProfileClick={handleProfileClick}
        />
        <AuthModal 
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/account" element={<Account/>} />
          <Route path="/admin" element={<Admin/>} />
        </Routes>
      </div>
    </ModalProvider>
  )
}
